import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskBucket } from '../common/enums/risk-bucket.enum';
import { MlService } from '../ml/ml.service';
import { UserRole } from '../users/user-role.enum';
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
import { RiskEngineService } from './risk-engine/risk-engine.service';
import {
  calculateMaxAchievablePercent,
  calculateWeightedPercent,
} from './risk-engine/grading.utils';
import { CourseRiskResult } from './risk-engine/risk-engine.types';
import { AiSuggestionsService, SuggestionItem } from './suggestions/ai-suggestions.service';

export interface RequestUser {
  sub: string;
  role: UserRole;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(CourseWeight)
    private readonly courseWeightsRepository: Repository<CourseWeight>,
    @InjectRepository(CourseWeek)
    private readonly courseWeeksRepository: Repository<CourseWeek>,
    @InjectRepository(WeekSubmission)
    private readonly weekSubmissionsRepository: Repository<WeekSubmission>,
    @InjectRepository(ExamSubmission)
    private readonly examSubmissionsRepository: Repository<ExamSubmission>,
    @InjectRepository(RiskPrediction)
    private readonly riskPredictionsRepository: Repository<RiskPrediction>,
    @InjectRepository(AiSuggestion)
    private readonly aiSuggestionsRepository: Repository<AiSuggestion>,
    private readonly riskEngineService: RiskEngineService,
    private readonly aiSuggestionsService: AiSuggestionsService,
    private readonly mlService: MlService,
  ) {}

  async createCourse(user: RequestUser, payload: CreateCourseDto) {
    const course = this.coursesRepository.create({
      ownerUserId: user.sub,
      title: payload.title,
    });
    const savedCourse = await this.coursesRepository.save(course);

    const weeks = Array.from({ length: 15 }, (_, index) =>
      this.courseWeeksRepository.create({
        courseId: savedCourse.id,
        weekNumber: index + 1,
      }),
    );
    await this.courseWeeksRepository.save(weeks);

    return this.getCourseForResponse(savedCourse.id, user);
  }

  async listCourses(user: RequestUser) {
    const where = user.role === UserRole.ADMIN ? {} : { ownerUserId: user.sub };
    const rows = await this.coursesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return rows.map((course) => ({
      id: course.id,
      title: course.title,
      ownerUserId: course.ownerUserId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
  }

  async setManualSyllabus(user: RequestUser, courseId: string, payload: ManualSyllabusDto) {
    const course = await this.getCourseOrThrow(courseId, user);
    const normalizedWeights = normalizeAndValidateWeights(
      payload.weights as unknown as Record<string, number | undefined>,
    );

    if (payload.title) {
      course.title = payload.title;
      await this.coursesRepository.save(course);
    }

    await this.courseWeightsRepository.delete({ courseId: course.id });
    const rows = Object.entries(normalizedWeights).map(([componentName, weightPercent]) =>
      this.courseWeightsRepository.create({
        courseId: course.id,
        componentName: componentName as CourseComponent,
        weightPercent,
      }),
    );
    await this.courseWeightsRepository.save(rows);

    return {
      courseId: course.id,
      title: course.title,
      weights: normalizedWeights,
    };
  }

  async uploadSyllabus(user: RequestUser, courseId: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Syllabus file is required');
    }

    const course = await this.getCourseOrThrow(courseId, user);
    const parsed = await parseSyllabusFile(file);
    const payload: ManualSyllabusDto = {
      title: parsed.title ?? course.title,
      weights: parsed.weights,
    };
    return this.setManualSyllabus(user, courseId, payload);
  }

  async getWeights(user: RequestUser, courseId: string) {
    const course = await this.getCourseOrThrow(courseId, user);
    const rows = await this.courseWeightsRepository.find({
      where: { courseId: course.id },
      order: { componentName: 'ASC' },
    });

    return {
      courseId: course.id,
      title: course.title,
      totalWeight: rows.reduce((sum, row) => sum + row.weightPercent, 0),
      weights: rows.map((row) => ({
        componentName: row.componentName,
        weightPercent: row.weightPercent,
      })),
    };
  }

  async submitExam(user: RequestUser, courseId: string, payload: ExamSubmissionDto) {
    const course = await this.getCourseOrThrow(courseId, user);
    await this.examSubmissionsRepository.upsert(
      {
        courseId: course.id,
        userId: user.sub,
        type: payload.type,
        score: payload.score,
        submittedAt: new Date(),
      },
      ['courseId', 'userId', 'type'],
    );

    return {
      courseId: course.id,
      type: payload.type,
      score: payload.score,
    };
  }

  async getExams(user: RequestUser, courseId: string) {
    await this.getCourseOrThrow(courseId, user);
    const rows = await this.examSubmissionsRepository.find({
      where: { courseId, userId: user.sub },
      order: { submittedAt: 'DESC' },
    });
    return {
      courseId,
      exams: rows.map((row) => ({
        type: row.type,
        score: row.score,
        submittedAt: row.submittedAt,
      })),
    };
  }

  async submitWeek(user: RequestUser, courseId: string, weekNumber: number, payload: WeekSubmissionDto) {
    await this.getCourseOrThrow(courseId, user);
    const week = await this.courseWeeksRepository.findOne({
      where: { courseId, weekNumber },
    });
    if (!week) {
      throw new NotFoundException(`Week ${weekNumber} was not found for course ${courseId}`);
    }

    await this.weekSubmissionsRepository.upsert(
      {
        courseWeekId: week.id,
        userId: user.sub,
        quizScore: payload.quizScore ?? null,
        assignmentScore: payload.assignmentScore ?? null,
        absenceCountWeek: payload.absenceCountWeek ?? 0,
        submittedAt: new Date(),
      },
      ['courseWeekId', 'userId'],
    );

    return {
      courseId,
      weekNumber,
      ...payload,
    };
  }

  async getWeeks(user: RequestUser, courseId: string) {
    await this.getCourseOrThrow(courseId, user);
    const weeks = await this.courseWeeksRepository.find({
      where: { courseId },
      order: { weekNumber: 'ASC' },
    });
    const submissions = await this.weekSubmissionsRepository.find({
      where: { userId: user.sub },
      relations: { courseWeek: true },
    });

    const byWeekId = new Map(
      submissions
        .filter((submission) => submission.courseWeek?.courseId === courseId)
        .map((submission) => [submission.courseWeekId, submission]),
    );

    return weeks.map((week) => {
      const submission = byWeekId.get(week.id);
      return {
        weekNumber: week.weekNumber,
        quizScore: submission?.quizScore ?? null,
        assignmentScore: submission?.assignmentScore ?? null,
        absenceCountWeek: submission?.absenceCountWeek ?? 0,
        submittedAt: submission?.submittedAt ?? null,
      };
    });
  }

  async getRisk(user: RequestUser, courseId: string) {
    const calculated = await this.calculateRisk(user, courseId, false);
    return calculated;
  }

  async predict(user: RequestUser, courseId: string) {
    const calculated = await this.calculateRisk(user, courseId, true);
    return calculated;
  }

  async getSuggestions(user: RequestUser, courseId: string) {
    await this.getCourseOrThrow(courseId, user);
    const latest = await this.aiSuggestionsRepository.findOne({
      where: { courseId, userId: user.sub },
      order: { createdAt: 'DESC' },
    });
    if (latest) {
      return {
        courseId,
        suggestions: latest.suggestionsJson,
        createdAt: latest.createdAt,
      };
    }

    const predicted = await this.calculateRisk(user, courseId, true);
    return {
      courseId,
      suggestions: predicted.suggestions,
      createdAt: predicted.createdAt,
    };
  }

  private async calculateRisk(user: RequestUser, courseId: string, persist: boolean) {
    const course = await this.getCourseOrThrow(courseId, user);
    const weightsMap = await this.getWeightsMap(course.id);
    const allWeeks = await this.courseWeeksRepository.find({
      where: { courseId: course.id },
      order: { weekNumber: 'ASC' },
    });
    const weekSubmissions = await this.weekSubmissionsRepository.find({
      where: {
        userId: user.sub,
      },
      relations: {
        courseWeek: true,
      },
    });

    const scopedWeekSubmissions = weekSubmissions
      .filter((submission) => submission.courseWeek?.courseId === course.id)
      .sort((a, b) => (a.courseWeek?.weekNumber ?? 0) - (b.courseWeek?.weekNumber ?? 0));

    const examSubmissions = await this.examSubmissionsRepository.find({
      where: {
        courseId: course.id,
        userId: user.sub,
      },
    });

    const midtermScore = examSubmissions.find((item) => item.type === ExamType.MIDTERM)?.score ?? 0;
    const finalScore = examSubmissions.find((item) => item.type === ExamType.FINAL)?.score ?? 0;

    const quizScores = scopedWeekSubmissions
      .map((item) => item.quizScore)
      .filter((value): value is number => value !== null && value !== undefined);

    const assignmentScores = scopedWeekSubmissions
      .map((item) => item.assignmentScore)
      .filter((value): value is number => value !== null && value !== undefined);

    const quizzesAverage = averageOrZero(quizScores);
    const assignmentsAverage = averageOrZero(assignmentScores);
    const totalAbsences = scopedWeekSubmissions.reduce((sum, item) => sum + (item.absenceCountWeek ?? 0), 0);
    const missingWeeksCount = Math.max(0, allWeeks.length - scopedWeekSubmissions.length);
    const examCompletedRatio =
      [ExamType.MIDTERM, ExamType.FINAL].filter((type) =>
        examSubmissions.some((submission) => submission.type === type),
      ).length / 2;
    const quizTrend = computeQuizTrend(scopedWeekSubmissions);

    const weightedPercent = calculateWeightedPercent({
      weights: weightsMap,
      midtermScore,
      finalScore,
      quizzesAverage,
      assignmentsAverage,
      projectsScore: 0,
    });

    const completedMap: Record<CourseComponent, boolean> = {
      [CourseComponent.MIDTERM]: midtermScore > 0 || examSubmissions.some((item) => item.type === ExamType.MIDTERM),
      [CourseComponent.FINAL]: finalScore > 0 || examSubmissions.some((item) => item.type === ExamType.FINAL),
      [CourseComponent.QUIZZES]: quizScores.length >= 15,
      [CourseComponent.ASSIGNMENTS]: assignmentScores.length >= 15,
      [CourseComponent.PROJECTS]: false,
    };

    const remainingWeight = Object.entries(weightsMap).reduce((sum, [component, weight]) => {
      const key = component as CourseComponent;
      return sum + (completedMap[key] ? 0 : weight);
    }, 0);
    const maxAchievablePercent = calculateMaxAchievablePercent(weightedPercent, remainingWeight);

    let mlProbability: number | undefined;
    try {
      const ml = await this.mlService.predictCourseRisk({
        weightedPercent,
        remainingWeight,
        maxAchievablePercent,
        totalAbsences,
        absencesRate: clamp(totalAbsences / 30, 0, 1),
        missingWeeksCount,
        examCompletedRatio,
        quizTrend,
      });
      mlProbability = ml.probabilityFail;
    } catch {
      mlProbability = undefined;
    }

    const result: CourseRiskResult = this.riskEngineService.calculate({
      weightedPercent,
      remainingWeight,
      maxAchievablePercent,
      totalAbsences,
      missingWeeksCount,
      examCompletedRatio,
      quizTrend,
      allComponentsCompleted: Object.entries(weightsMap).every(
        ([component, weight]) => weight === 0 || completedMap[component as CourseComponent],
      ),
      mlProbability,
    });

    const absenceStatus =
      totalAbsences > 30 ? 'auto_fail' : totalAbsences >= 25 ? 'critical' : totalAbsences >= 20 ? 'warning' : 'ok';

    let createdAt = new Date();
    let suggestions: SuggestionItem[] = [];
    if (persist) {
      const prediction = this.riskPredictionsRepository.create({
        courseId: course.id,
        userId: user.sub,
        probabilityFail: result.probabilityFail,
        bucket: result.bucket,
        isAutoFail: result.isAutoFail,
        reasonsJson: result.reasons,
        detailsJson: result.features,
      });
      const savedPrediction = await this.riskPredictionsRepository.save(prediction);
      createdAt = savedPrediction.createdAt;

      suggestions = await this.aiSuggestionsService.generate(
        course.title,
        result.reasons,
        result.features.weightedPercent,
      );
      const suggestionRow = this.aiSuggestionsRepository.create({
        courseId: course.id,
        userId: user.sub,
        suggestionsJson: suggestions,
      });
      await this.aiSuggestionsRepository.save(suggestionRow);
    } else {
      const latestSuggestion = await this.aiSuggestionsRepository.findOne({
        where: { courseId: course.id, userId: user.sub },
        order: { createdAt: 'DESC' },
      });
      suggestions = (latestSuggestion?.suggestionsJson ?? []) as unknown as SuggestionItem[];
      createdAt = latestSuggestion?.createdAt ?? createdAt;
    }

    return {
      courseId: course.id,
      title: course.title,
      weightedPercent: result.features.weightedPercent,
      remainingWeight: result.features.remainingWeight,
      maxAchievablePercent: result.features.maxAchievablePercent,
      canStillPass: result.features.maxAchievablePercent >= 50 && !result.isAutoFail,
      totalAbsences: result.features.totalAbsences,
      absenceStatus,
      probabilityFail: result.probabilityFail,
      bucket: result.bucket as RiskBucket,
      isAutoFail: result.isAutoFail,
      reasons: result.reasons,
      features: result.features,
      suggestions,
      createdAt,
    };
  }

  private async getWeightsMap(courseId: string): Promise<Record<CourseComponent, number>> {
    const rows = await this.courseWeightsRepository.find({
      where: { courseId },
    });

    if (rows.length === 0) {
      throw new BadRequestException('Course weights are not configured');
    }

    const map: Record<CourseComponent, number> = {
      [CourseComponent.MIDTERM]: 0,
      [CourseComponent.FINAL]: 0,
      [CourseComponent.QUIZZES]: 0,
      [CourseComponent.ASSIGNMENTS]: 0,
      [CourseComponent.PROJECTS]: 0,
    };

    for (const row of rows) {
      map[row.componentName] = row.weightPercent;
    }

    const total = Object.values(map).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 100) > 0.0001) {
      throw new BadRequestException(`Invalid course weights: expected 100, got ${total}`);
    }
    return map;
  }

  private async getCourseForResponse(courseId: string, user: RequestUser) {
    const course = await this.getCourseOrThrow(courseId, user);
    const weights = await this.courseWeightsRepository.find({
      where: { courseId: course.id },
    });
    return {
      id: course.id,
      title: course.title,
      ownerUserId: course.ownerUserId,
      weeks: 15,
      weights,
      createdAt: course.createdAt,
    };
  }

  private async getCourseOrThrow(courseId: string, user: RequestUser): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    if (user.role !== UserRole.ADMIN && course.ownerUserId !== user.sub) {
      throw new ForbiddenException('You do not have access to this course');
    }
    return course;
  }
}

export function normalizeAndValidateWeights(
  weights: Record<string, number | undefined>,
): Record<CourseComponent, number> {
  const normalized: Record<CourseComponent, number> = {
    [CourseComponent.MIDTERM]: sanitizeWeight(weights.midterm),
    [CourseComponent.FINAL]: sanitizeWeight(weights.final),
    [CourseComponent.QUIZZES]: sanitizeWeight(weights.quizzes),
    [CourseComponent.ASSIGNMENTS]: sanitizeWeight(weights.assignments),
    [CourseComponent.PROJECTS]: sanitizeWeight(weights.projects),
  };

  const total = Object.values(normalized).reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.0001) {
    throw new BadRequestException(`Weights must sum to 100, got ${total}`);
  }
  return normalized;
}

function sanitizeWeight(value: number | undefined): number {
  const next = Number(value ?? 0);
  if (!Number.isFinite(next) || next < 0 || next > 100) {
    throw new BadRequestException('Weight must be between 0 and 100');
  }
  return next;
}

function averageOrZero(values: number[]): number {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeQuizTrend(submissions: WeekSubmission[]): number {
  const quizSeries = submissions
    .map((submission) => ({
      week: submission.courseWeek?.weekNumber ?? 0,
      score: submission.quizScore,
    }))
    .filter((item): item is { week: number; score: number } => item.score !== null && item.score !== undefined)
    .sort((a, b) => a.week - b.week);

  if (quizSeries.length < 2) {
    return 0;
  }

  const midpoint = Math.floor(quizSeries.length / 2);
  const firstHalf = quizSeries.slice(0, midpoint).map((item) => item.score);
  const secondHalf = quizSeries.slice(midpoint).map((item) => item.score);

  if (!firstHalf.length || !secondHalf.length) {
    return 0;
  }

  const trend = (averageOrZero(secondHalf) - averageOrZero(firstHalf)) / 100;
  return clamp(trend, -1, 1);
}

async function parseSyllabusFile(
  file: Express.Multer.File,
): Promise<{ title?: string; weights: Record<string, number | undefined> }> {
  const extension = (file.originalname.split('.').pop() ?? '').toLowerCase();
  let text = '';

  if (extension === 'txt') {
    text = file.buffer.toString('utf8');
  } else if (extension === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(file.buffer);
    text = parsed.text ?? '';
  } else if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    text = parsed.value ?? '';
  } else {
    throw new BadRequestException('Unsupported file format. Use PDF, DOCX, or TXT.');
  }

  const title = text.split('\n').find((line) => line.trim().length > 0)?.trim();
  const weights = {
    midterm: extractWeight(text, 'midterm'),
    final: extractWeight(text, 'final'),
    quizzes: extractWeight(text, 'quizzes|quiz'),
    assignments: extractWeight(text, 'assignments|assignment'),
    projects: extractWeight(text, 'projects|project'),
  };

  return { title, weights };
}

function extractWeight(text: string, componentPattern: string): number | undefined {
  const regex = new RegExp(`(?:${componentPattern})[^\\d]{0,20}(\\d{1,3}(?:\\.\\d+)?)\\s*%?`, 'i');
  const match = regex.exec(text);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}
