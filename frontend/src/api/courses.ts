import {
  AdminStudentDetailsResponse,
  AdminStudentsResponse,
  Course,
  CourseRiskResponse,
  CourseWeightInput,
  CourseWhatIfResponse,
} from '../types';
import { apiClient } from './client';

export const getStudentCourses = async () => {
  const { data } = await apiClient.get<Course[]>('/student/courses');
  return data;
};
export const deleteStudentCourse = async (courseId: string) => {
  const { data } = await apiClient.delete<{ courseId: string; studentId: string; deleted: boolean }>(
    `/student/courses/${courseId}`,
  );
  return data;
};


export const createStudentCourse = async (title: string) => {
  const { data } = await apiClient.post<Course>('/student/courses', { title });
  return data;
};

// Backward-compatible aliases for legacy pages; both are student-scoped now.
export const getCourses = getStudentCourses;
export const createCourse = createStudentCourse;

export const getStudentCourseById = async (courseId: string) => {
  const { data } = await apiClient.get<Course>(`/student/courses/${courseId}`);
  return data;
};

export const saveManualSyllabus = async (courseId: string, payload: { title?: string; weights: CourseWeightInput }) => {
  const { data } = await apiClient.post(`/student/courses/${courseId}/syllabus/manual`, payload);
  return data;
};

export const uploadSyllabusFile = async (courseId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post(`/student/courses/${courseId}/syllabus/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getCourseWeights = async (courseId: string) => {
  const { data } = await apiClient.get(`/student/courses/${courseId}/weights`);
  return data as {
    courseId: string;
    studentId: string;
    title: string;
    totalWeight: number;
    weights: Array<{ componentName: string; weightPercent: number }>;
  };
};

export const getWeeks = async (courseId: string) => {
  const { data } = await apiClient.get<
    Array<{
      weekNumber: number;
      quizScore: number | null;
      assignmentScore: number | null;
      absenceCountWeek: number;
      submittedAt: string | null;
    }>
  >(`/student/courses/${courseId}/weeks`);
  return data;
};

export const submitWeek = async (
  courseId: string,
  weekNumber: number,
  payload: { quizScore?: number; assignmentScore?: number; absenceCountWeek: number },
) => {
  const { data } = await apiClient.post(`/student/courses/${courseId}/weeks/${weekNumber}/submission`, payload);
  return data;
};

export const getExams = async (courseId: string) => {
  const { data } = await apiClient.get<{
    courseId: string;
    studentId: string;
    exams: Array<{ type: 'midterm' | 'final'; score: number; submittedAt: string }>;
  }>(`/student/courses/${courseId}/exams`);
  return data;
};

export const submitExam = async (courseId: string, payload: { type: 'midterm' | 'final'; score: number }) => {
  const { data } = await apiClient.post(`/student/courses/${courseId}/exams`, payload);
  return data;
};

export const getCourseRisk = async (courseId: string) => {
  const { data } = await apiClient.get<CourseRiskResponse>(`/student/courses/${courseId}/risk`);
  return data;
};

export const predictCourseRisk = async (courseId: string) => {
  const { data } = await apiClient.post<CourseRiskResponse>(`/student/courses/${courseId}/predict`);
  return data;
};

export const runCourseWhatIf = async (
  courseId: string,
  payload: {
    overrides: Partial<{
      midtermScore: number;
      finalScore: number;
      quizzesAverage: number;
      assignmentsAverage: number;
      totalAbsences: number;
      missingWeeksCount: number;
    }>;
    save?: boolean;
  },
) => {
  const { data } = await apiClient.post<CourseWhatIfResponse>(`/student/courses/${courseId}/what-if`, payload);
  return data;
};

export const getCourseSuggestions = async (courseId: string) => {
  const { data } = await apiClient.get(`/student/courses/${courseId}/suggestions`);
  return data as {
    courseId: string;
    studentId: string;
    suggestions: Array<{
      title: string;
      why: string;
      actions: string[];
      expectedImpact?: string;
    }>;
    createdAt: string;
  };
};

export const getAdminStudents = async (params?: {
  bucket?: 'green' | 'yellow' | 'red';
  highRiskOnly?: boolean;
  courseId?: string;
  sort?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}) => {
  const { data } = await apiClient.get<AdminStudentsResponse>('/admin/students', { params });
  return data;
};

export const getAdminStudent = async (studentId: string) => {
  const { data } = await apiClient.get<AdminStudentDetailsResponse>(`/admin/students/${studentId}`);
  return data;
};

export const getAdminStudentCourses = async (studentId: string) => {
  const { data } = await apiClient.get<AdminStudentDetailsResponse['courses']>(`/admin/students/${studentId}/courses`);
  return data;
};

export const getAdminStudentCourseRisk = async (studentId: string, courseId: string) => {
  const { data } = await apiClient.get<CourseRiskResponse>(`/admin/students/${studentId}/courses/${courseId}/risk`);
  return data;
};
