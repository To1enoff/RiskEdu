import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RiskBucket } from '../common/enums/risk-bucket.enum';
import { MlService } from '../ml/ml.service';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { AdminStudentsQueryDto } from './dto/admin-students-query.dto';
import { CourseWhatIfDto } from './dto/course-whatif.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ExamSubmissionDto } from './dto/exam-submission.dto';
import { ManualSyllabusDto } from './dto/manual-syllabus.dto';
import { WeekSubmissionDto } from './dto/week-submission.dto';
import { CourseComponent } from './enums/course-component.enum';
import { ExamType } from './enums/exam-type.enum';
import { AiSuggestion } from './entities/ai-suggestion.entity';
import { CourseWeek } from './entities/course-week.entity';
import { CourseWeight } from './entities/course-weight.entity';
import { Course } from './entities/course.entity';
import { ExamSubmission } from './entities/exam-submission.entity';
import { RiskPrediction } from './entities/risk-prediction.entity';
import { WeekSubmission } from './entities/week-submission.entity';
import { WhatIfSimulation } from './entities/what-if-simulation.entity';
import { RiskEngineService } from './risk-engine/risk-engine.service';
import { calculateMaxAchievablePercent, calculateWeightedPercent } from './risk-engine/grading.utils';
import { CourseRiskResult } from './risk-engine/risk-engine.types';
import { AiSuggestionsService, SuggestionItem } from './suggestions/ai-suggestions.service';

export interface RequestUser {
  sub: string;
  role: UserRole;
}

interface Computation {
  course: Course;
  studentId: string;
  weightedPercent: number;
  remainingWeight: number;
  maxAchievablePercent: number;
  totalAbsences: number;
  missingWeeksCount: number;
  examCompletedRatio: number;
  quizTrend: number;
  allComponentsCompleted: boolean;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseWeight) private readonly weightsRepo: Repository<CourseWeight>,
    @InjectRepository(CourseWeek) private readonly weeksRepo: Repository<CourseWeek>,
    @InjectRepository(WeekSubmission) private readonly weekSubmissionsRepo: Repository<WeekSubmission>,
    @InjectRepository(ExamSubmission) private readonly examSubmissionsRepo: Repository<ExamSubmission>,
    @InjectRepository(RiskPrediction) private readonly riskRepo: Repository<RiskPrediction>,
    @InjectRepository(AiSuggestion) private readonly suggestionsRepo: Repository<AiSuggestion>,
    @InjectRepository(WhatIfSimulation) private readonly whatIfRepo: Repository<WhatIfSimulation>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly riskEngine: RiskEngineService,
    private readonly aiSuggestions: AiSuggestionsService,
    private readonly mlService: MlService,
  ) {}

  async createStudentCourse(user: RequestUser, payload: CreateCourseDto) {
    this.assertStudent(user);
    const course = await this.coursesRepo.save(this.coursesRepo.create({ studentId: user.sub, title: payload.title }));
    await this.seedWeeks(course.id);
    return this.getCourseCard(course.id, user.sub);
  }

  async listStudentCourses(user: RequestUser) {
    this.assertStudent(user);
    const courses = await this.coursesRepo.find({ where: { studentId: user.sub }, order: { createdAt: 'DESC' } });
    return Promise.all(courses.map((c) => this.getCourseCard(c.id, user.sub)));
  }

  async getStudentCourse(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    return this.getCourseCard(courseId, user.sub);
  }

  async setManualSyllabus(user: RequestUser, courseId: string, payload: ManualSyllabusDto) {
    this.assertStudent(user);
    const course = await this.getStudentCourseOrThrow(courseId, user.sub);
    const normalizedWeights = normalizeAndValidateWeights(payload.weights as Record<string, number | undefined>);
    if (payload.title) {
      course.title = payload.title;
      await this.coursesRepo.save(course);
    }
    await this.weightsRepo.delete({ courseId });
    await this.weightsRepo.save(
      Object.entries(normalizedWeights).map(([componentName, weightPercent]) =>
        this.weightsRepo.create({ courseId, componentName: componentName as CourseComponent, weightPercent }),
      ),
    );
    return { courseId, studentId: user.sub, title: course.title, weights: normalizedWeights };
  }

  async getWeights(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    const course = await this.getStudentCourseOrThrow(courseId, user.sub);
    const rows = await this.weightsRepo.find({ where: { courseId }, order: { componentName: 'ASC' } });
    return {
      courseId,
      studentId: user.sub,
      title: course.title,
      totalWeight: rows.reduce((s, r) => s + r.weightPercent, 0),
      weights: rows.map((r) => ({ componentName: r.componentName, weightPercent: r.weightPercent })),
    };
  }

  async uploadSyllabus(user: RequestUser, courseId: string, file: Express.Multer.File | undefined) {
    this.assertStudent(user);
    if (!file) throw new BadRequestException('Syllabus file is required');
    const course = await this.getStudentCourseOrThrow(courseId, user.sub);
    const parsed = await parseSyllabusFile(file);
    return this.setManualSyllabus(user, courseId, { title: parsed.title ?? course.title, weights: parsed.weights });
  }

  async submitExam(user: RequestUser, courseId: string, payload: ExamSubmissionDto) {
    this.assertStudent(user);
    await this.getStudentCourseOrThrow(courseId, user.sub);
    await this.examSubmissionsRepo.upsert(
      { courseId, studentId: user.sub, type: payload.type, score: payload.score, submittedAt: new Date() },
      ['courseId', 'studentId', 'type'],
    );
    return { courseId, studentId: user.sub, ...payload };
  }

  async getExams(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    await this.getStudentCourseOrThrow(courseId, user.sub);
    const exams = await this.examSubmissionsRepo.find({
      where: { courseId, studentId: user.sub },
      order: { submittedAt: 'DESC' },
    });
    return { courseId, studentId: user.sub, exams };
  }

  async submitWeek(user: RequestUser, courseId: string, weekNumber: number, payload: WeekSubmissionDto) {
    this.assertStudent(user);
    await this.getStudentCourseOrThrow(courseId, user.sub);
    const week = await this.weeksRepo.findOne({ where: { courseId, weekNumber } });
    if (!week) throw new NotFoundException(`Week ${weekNumber} was not found for course ${courseId}`);
    await this.weekSubmissionsRepo.upsert(
      {
        courseWeekId: week.id,
        studentId: user.sub,
        quizScore: payload.quizScore ?? null,
        assignmentScore: payload.assignmentScore ?? null,
        absenceCountWeek: payload.absenceCountWeek ?? 0,
        submittedAt: new Date(),
      },
      ['courseWeekId', 'studentId'],
    );
    return { courseId, studentId: user.sub, weekNumber, ...payload };
  }

  async getWeeks(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    await this.getStudentCourseOrThrow(courseId, user.sub);
    const weeks = await this.weeksRepo.find({ where: { courseId }, order: { weekNumber: 'ASC' } });
    const subs = await this.weekSubmissionsRepo.find({ where: { studentId: user.sub }, relations: { courseWeek: true } });
    const byWeek = new Map(subs.filter((s) => s.courseWeek?.courseId === courseId).map((s) => [s.courseWeekId, s]));
    return weeks.map((w) => {
      const s = byWeek.get(w.id);
      return {
        weekNumber: w.weekNumber,
        quizScore: s?.quizScore ?? null,
        assignmentScore: s?.assignmentScore ?? null,
        absenceCountWeek: s?.absenceCountWeek ?? 0,
        submittedAt: s?.submittedAt ?? null,
      };
    });
  }

  async getStudentCourseRisk(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    return this.calculateCourseRisk(courseId, user.sub, false, false);
  }

  async predictStudentCourse(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    return this.calculateCourseRisk(courseId, user.sub, true, true);
  }

  async runCourseWhatIf(user: RequestUser, courseId: string, payload: CourseWhatIfDto) {
    this.assertStudent(user);
    const course = await this.getStudentCourseOrThrow(courseId, user.sub);
    const overrides = toNumericOverrides(payload.overrides as unknown as Record<string, unknown> | undefined);
    const baseline = await this.evaluate(await this.buildComputation(course, user.sub, {}));
    const simulatedComputation = await this.buildComputation(course, user.sub, overrides);
    const simulated = await this.evaluate(simulatedComputation);
    const delta = simulated.probabilityFail - baseline.probabilityFail;
    if (payload.save) {
      await this.whatIfRepo.save(
        this.whatIfRepo.create({
          courseId,
          studentId: user.sub,
          baselineProbability: baseline.probabilityFail,
          newProbability: simulated.probabilityFail,
          delta,
          overrides,
        }),
      );
    }
    return {
      courseId,
      studentId: user.sub,
      baselineProbability: baseline.probabilityFail,
      newProbability: simulated.probabilityFail,
      delta,
      bucket: simulated.bucket,
      isAutoFail: simulated.isAutoFail,
      reasons: simulated.reasons,
      // Course-scoped what-if: only changed fields inside one course.
      changedFeatures: Object.entries(overrides).map(([key, newValue]) => ({ key, newValue })),
      newWeightedPercent: simulatedComputation.weightedPercent,
    };
  }

  async getStudentSuggestions(user: RequestUser, courseId: string) {
    this.assertStudent(user);
    const latest = await this.suggestionsRepo.findOne({ where: { courseId, studentId: user.sub }, order: { createdAt: 'DESC' } });
    if (latest) return { courseId, studentId: user.sub, suggestions: latest.suggestionsJson, createdAt: latest.createdAt };
    const predicted = await this.predictStudentCourse(user, courseId);
    return { courseId, studentId: user.sub, suggestions: predicted.suggestions, createdAt: predicted.createdAt };
  }

  async adminListStudents(query: AdminStudentsQueryDto) {
    const students = await this.usersRepo.find({ where: { role: UserRole.STUDENT } });
    const studentIds = students.map((s) => s.id);
    if (!studentIds.length) return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
    const courses = await this.coursesRepo.find({
      where: query.courseId ? { studentId: In(studentIds), id: query.courseId } : { studentId: In(studentIds) },
    });
    const usersById = new Map(students.map((s) => [s.id, s]));
    const rows = await Promise.all(
      courses.map(async (course) => {
        const risk = await this.calculateCourseRisk(course.id, course.studentId, false, false);
        const student = usersById.get(course.studentId);
        return {
          studentId: course.studentId,
          studentName: student?.fullName ?? student?.email ?? course.studentId,
          studentEmail: student?.email ?? null,
          courseId: course.id,
          courseTitle: course.title,
          weightedPercent: risk.weightedPercent,
          probabilityFail: risk.probabilityFail,
          bucket: risk.bucket,
          totalAbsences: risk.totalAbsences,
          canStillPass: risk.canStillPass,
        };
      }),
    );
    const filtered = rows.filter((r) => (!query.bucket || r.bucket === query.bucket) && (!query.highRiskOnly || r.probabilityFail >= 0.66));
    filtered.sort((a, b) => (query.sort === 'asc' ? a.probabilityFail - b.probabilityFail : b.probabilityFail - a.probabilityFail));
    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    return { items: filtered.slice(start, start + query.limit), total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  async adminGetStudent(studentId: string) {
    const student = await this.getStudentUserOrThrow(studentId);
    const courses = await this.adminGetStudentCourses(studentId);
    return { id: student.id, fullName: student.fullName, email: student.email, role: student.role, courses };
  }

  async adminGetStudentCourses(studentId: string) {
    await this.getStudentUserOrThrow(studentId);
    const courses = await this.coursesRepo.find({ where: { studentId }, order: { createdAt: 'DESC' } });
    return Promise.all(courses.map((course) => this.calculateCourseRisk(course.id, studentId, false, false)));
  }

  async adminGetStudentCourseRisk(studentId: string, courseId: string) {
    await this.getStudentUserOrThrow(studentId);
    const course = await this.getCourseByIdOrThrow(courseId);
    if (course.studentId !== studentId) throw new ForbiddenException('Course does not belong to requested student');
    return this.calculateCourseRisk(courseId, studentId, false, false);
  }

  private async calculateCourseRisk(courseId: string, studentId: string, persistPrediction: boolean, includeSuggestions: boolean) {
    const course = await this.getCourseByIdOrThrow(courseId);
    if (course.studentId !== studentId) throw new ForbiddenException('Course does not belong to this student');
    const computation = await this.buildComputation(course, studentId, {});
    const evaluated = await this.evaluate(computation);
    let suggestions: SuggestionItem[] = [];
    let createdAt = new Date();
    if (persistPrediction) {
      const prediction = await this.riskRepo.save(
        this.riskRepo.create({
          courseId,
          studentId,
          probabilityFail: evaluated.probabilityFail,
          bucket: evaluated.bucket,
          isAutoFail: evaluated.isAutoFail,
          reasonsJson: evaluated.reasons,
          detailsJson: evaluated.features,
        }),
      );
      createdAt = prediction.createdAt;
      suggestions = await this.aiSuggestions.generate(course.title, evaluated.reasons, computation.weightedPercent);
      await this.suggestionsRepo.save(this.suggestionsRepo.create({ courseId, studentId, suggestionsJson: suggestions }));
    } else if (includeSuggestions) {
      const latest = await this.suggestionsRepo.findOne({ where: { courseId, studentId }, order: { createdAt: 'DESC' } });
      suggestions = (latest?.suggestionsJson ?? []) as unknown as SuggestionItem[];
      createdAt = latest?.createdAt ?? createdAt;
    }
    return {
      courseId,
      studentId,
      title: course.title,
      weightedPercent: computation.weightedPercent,
      remainingWeight: computation.remainingWeight,
      maxAchievablePercent: computation.maxAchievablePercent,
      canStillPass: computation.maxAchievablePercent >= 50 && !evaluated.isAutoFail,
      totalAbsences: computation.totalAbsences,
      absenceStatus: toAbsenceStatus(computation.totalAbsences),
      probabilityFail: evaluated.probabilityFail,
      bucket: evaluated.bucket as RiskBucket,
      isAutoFail: evaluated.isAutoFail,
      reasons: evaluated.reasons,
      suggestions,
      createdAt,
    };
  }

  private async buildComputation(course: Course, studentId: string, overrides: Record<string, number>): Promise<Computation> {
    const weights = await this.getWeightsMap(course.id);
    const allWeeks = await this.weeksRepo.find({ where: { courseId: course.id }, order: { weekNumber: 'ASC' } });
    const weekSubs = await this.weekSubmissionsRepo.find({ where: { studentId }, relations: { courseWeek: true } });
    const scopedWeekSubs = weekSubs.filter((s) => s.courseWeek?.courseId === course.id);
    const exams = await this.examSubmissionsRepo.find({ where: { courseId: course.id, studentId } });
    const midtermScore = clamp(overrides.midtermScore ?? exams.find((e) => e.type === ExamType.MIDTERM)?.score ?? 0, 0, 100);
    const finalScore = clamp(overrides.finalScore ?? exams.find((e) => e.type === ExamType.FINAL)?.score ?? 0, 0, 100);
    const quizScores = scopedWeekSubs.map((s) => s.quizScore).filter((v): v is number => v !== null && v !== undefined);
    const assignmentScores = scopedWeekSubs.map((s) => s.assignmentScore).filter((v): v is number => v !== null && v !== undefined);
    const quizzesAverage = clamp(overrides.quizzesAverage ?? averageOrZero(quizScores), 0, 100);
    const assignmentsAverage = clamp(overrides.assignmentsAverage ?? averageOrZero(assignmentScores), 0, 100);
    const totalAbsences = Math.max(0, Math.round(overrides.totalAbsences ?? scopedWeekSubs.reduce((sum, s) => sum + (s.absenceCountWeek ?? 0), 0)));
    const missingWeeksCount = clamp(Math.round(overrides.missingWeeksCount ?? Math.max(0, allWeeks.length - scopedWeekSubs.length)), 0, 15);
    const weightedPercent = calculateWeightedPercent({ weights, midtermScore, finalScore, quizzesAverage, assignmentsAverage, projectsScore: 0 });
    const completed = {
      [CourseComponent.MIDTERM]: overrides.midtermScore !== undefined || exams.some((e) => e.type === ExamType.MIDTERM),
      [CourseComponent.FINAL]: overrides.finalScore !== undefined || exams.some((e) => e.type === ExamType.FINAL),
      [CourseComponent.QUIZZES]: overrides.quizzesAverage !== undefined || quizScores.length >= 15,
      [CourseComponent.ASSIGNMENTS]: overrides.assignmentsAverage !== undefined || assignmentScores.length >= 15,
      [CourseComponent.PROJECTS]: false,
    };
    const remainingWeight = Object.entries(weights).reduce((sum, [component, weight]) => sum + (completed[component as CourseComponent] ? 0 : weight), 0);
    const allComponentsCompleted = Object.entries(weights).every(([component, weight]) => weight === 0 || completed[component as CourseComponent]);
    return {
      course,
      studentId,
      weightedPercent,
      remainingWeight,
      maxAchievablePercent: calculateMaxAchievablePercent(weightedPercent, remainingWeight),
      totalAbsences,
      missingWeeksCount,
      examCompletedRatio: [completed.midterm, completed.final].filter(Boolean).length / 2,
      quizTrend: computeQuizTrend(scopedWeekSubs),
      allComponentsCompleted,
    };
  }

  private async evaluate(computation: Computation): Promise<CourseRiskResult> {
    let mlProbability: number | undefined;
    try {
      const ml = await this.mlService.predictCourseRisk({
        weightedPercent: computation.weightedPercent,
        remainingWeight: computation.remainingWeight,
        maxAchievablePercent: computation.maxAchievablePercent,
        totalAbsences: computation.totalAbsences,
        absencesRate: clamp(computation.totalAbsences / 30, 0, 1),
        missingWeeksCount: computation.missingWeeksCount,
        examCompletedRatio: computation.examCompletedRatio,
        quizTrend: computation.quizTrend,
      });
      mlProbability = ml.probabilityFail;
    } catch {
      mlProbability = undefined;
    }
    return this.riskEngine.calculate({
      weightedPercent: computation.weightedPercent,
      remainingWeight: computation.remainingWeight,
      maxAchievablePercent: computation.maxAchievablePercent,
      totalAbsences: computation.totalAbsences,
      missingWeeksCount: computation.missingWeeksCount,
      examCompletedRatio: computation.examCompletedRatio,
      quizTrend: computation.quizTrend,
      allComponentsCompleted: computation.allComponentsCompleted,
      mlProbability,
    });
  }

  private async getCourseCard(courseId: string, studentId: string) {
    const course = await this.getStudentCourseOrThrow(courseId, studentId);
    const risk = await this.calculateCourseRisk(course.id, studentId, false, false);
    return {
      id: course.id,
      studentId: course.studentId,
      title: course.title,
      createdAt: course.createdAt,
      weightedPercent: risk.weightedPercent,
      probabilityFail: risk.probabilityFail,
      bucket: risk.bucket,
      totalAbsences: risk.totalAbsences,
      absenceStatus: risk.absenceStatus,
    };
  }

  private async getStudentCourseOrThrow(courseId: string, studentId: string) {
    const course = await this.getCourseByIdOrThrow(courseId);
    if (course.studentId !== studentId) throw new ForbiddenException('You do not have access to this course');
    return course;
  }

  private async getCourseByIdOrThrow(courseId: string) {
    const course = await this.coursesRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException(`Course ${courseId} not found`);
    return course;
  }

  private async getStudentUserOrThrow(studentId: string) {
    const user = await this.usersRepo.findOne({ where: { id: studentId, role: UserRole.STUDENT } });
    if (!user) throw new NotFoundException(`Student ${studentId} not found`);
    return user;
  }

  private async getWeightsMap(courseId: string) {
    const rows = await this.weightsRepo.find({ where: { courseId } });
    if (rows.length === 0) throw new BadRequestException('Course weights are not configured');
    const map: Record<CourseComponent, number> = { midterm: 0, final: 0, quizzes: 0, assignments: 0, projects: 0 };
    for (const row of rows) map[row.componentName] = row.weightPercent;
    const total = Object.values(map).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 100) > 0.0001) throw new BadRequestException(`Invalid course weights: expected 100, got ${total}`);
    return map;
  }

  private async seedWeeks(courseId: string) {
    await this.weeksRepo.save(Array.from({ length: 15 }, (_, idx) => this.weeksRepo.create({ courseId, weekNumber: idx + 1 })));
  }

  private assertStudent(user: RequestUser) {
    if (user.role !== UserRole.STUDENT) throw new ForbiddenException('Only students can access this endpoint');
  }
}

export function normalizeAndValidateWeights(weights: Record<string, number | undefined>): Record<CourseComponent, number> {
  const normalized: Record<CourseComponent, number> = {
    midterm: sanitizeWeight(weights.midterm),
    final: sanitizeWeight(weights.final),
    quizzes: sanitizeWeight(weights.quizzes),
    assignments: sanitizeWeight(weights.assignments),
    projects: sanitizeWeight(weights.projects),
  };
  const total = Object.values(normalized).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.0001) throw new BadRequestException(`Weights must sum to 100, got ${total}`);
  return normalized;
}

function sanitizeWeight(value: number | undefined): number {
  const next = Number(value ?? 0);
  if (!Number.isFinite(next) || next < 0 || next > 100) throw new BadRequestException('Weight must be between 0 and 100');
  return next;
}

function averageOrZero(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toAbsenceStatus(totalAbsences: number): 'ok' | 'warning' | 'critical' | 'auto_fail' {
  if (totalAbsences > 30) return 'auto_fail';
  if (totalAbsences >= 25) return 'critical';
  if (totalAbsences >= 20) return 'warning';
  return 'ok';
}

function computeQuizTrend(submissions: WeekSubmission[]) {
  const quizSeries = submissions
    .map((s) => ({ week: s.courseWeek?.weekNumber ?? 0, score: s.quizScore }))
    .filter((i): i is { week: number; score: number } => i.score !== null && i.score !== undefined)
    .sort((a, b) => a.week - b.week);
  if (quizSeries.length < 2) return 0;
  const midpoint = Math.floor(quizSeries.length / 2);
  const firstHalf = quizSeries.slice(0, midpoint).map((i) => i.score);
  const secondHalf = quizSeries.slice(midpoint).map((i) => i.score);
  if (!firstHalf.length || !secondHalf.length) return 0;
  return clamp((averageOrZero(secondHalf) - averageOrZero(firstHalf)) / 100, -1, 1);
}

function toNumericOverrides(payload: Record<string, unknown> | undefined): Record<string, number> {
  const source = payload ?? {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(source)) {
    const next = Number(value);
    if (Number.isFinite(next)) {
      result[key] = next;
    }
  }
  return result;
}

async function parseSyllabusFile(file: Express.Multer.File): Promise<{ title?: string; weights: Record<string, number | undefined> }> {
  const extension = (file.originalname.split('.').pop() ?? '').toLowerCase();
  let text = '';
  if (extension === 'txt') {
    text = file.buffer.toString('utf8');
  } else if (extension === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    text = (await pdfParse(file.buffer)).text ?? '';
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth');
    text = (await mammoth.extractRawText({ buffer: file.buffer })).value ?? '';
  } else {
    throw new BadRequestException('Unsupported file format. Use PDF, DOCX, or TXT.');
  }
  const title = text.split('\n').find((line) => line.trim().length > 0)?.trim();
  return {
    title,
    weights: {
      midterm: extractWeight(text, 'midterm'),
      final: extractWeight(text, 'final'),
      quizzes: extractWeight(text, 'quizzes|quiz'),
      assignments: extractWeight(text, 'assignments|assignment'),
      projects: extractWeight(text, 'projects|project'),
    },
  };
}

function extractWeight(text: string, componentPattern: string): number | undefined {
  const regex = new RegExp(`(?:${componentPattern})[^\\d]{0,20}(\\d{1,3}(?:\\.\\d+)?)\\s*%?`, 'i');
  const match = regex.exec(text);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}
