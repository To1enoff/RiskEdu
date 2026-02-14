import { Course, CourseRiskResponse, CourseWeightInput } from '../types';
import { apiClient } from './client';

export const getCourses = async () => {
  const { data } = await apiClient.get<Course[]>('/courses');
  return data;
};

export const createCourse = async (title: string) => {
  const { data } = await apiClient.post<Course>('/courses', { title });
  return data;
};

export const saveManualSyllabus = async (courseId: string, payload: { title?: string; weights: CourseWeightInput }) => {
  const { data } = await apiClient.post(`/courses/${courseId}/syllabus/manual`, payload);
  return data;
};

export const uploadSyllabusFile = async (courseId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post(`/courses/${courseId}/syllabus/upload`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getCourseWeights = async (courseId: string) => {
  const { data } = await apiClient.get(`/courses/${courseId}/weights`);
  return data as {
    courseId: string;
    title: string;
    totalWeight: number;
    weights: Array<{ componentName: string; weightPercent: number }>;
  };
};

export const submitWeek = async (
  courseId: string,
  weekNumber: number,
  payload: { quizScore?: number; assignmentScore?: number; absenceCountWeek: number },
) => {
  const { data } = await apiClient.post(`/courses/${courseId}/weeks/${weekNumber}/submission`, payload);
  return data;
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
  >(`/courses/${courseId}/weeks`);
  return data;
};

export const submitExam = async (courseId: string, payload: { type: 'midterm' | 'final'; score: number }) => {
  const { data } = await apiClient.post(`/courses/${courseId}/exams`, payload);
  return data;
};

export const getExams = async (courseId: string) => {
  const { data } = await apiClient.get<{
    courseId: string;
    exams: Array<{ type: 'midterm' | 'final'; score: number; submittedAt: string }>;
  }>(`/courses/${courseId}/exams`);
  return data;
};

export const getCourseRisk = async (courseId: string) => {
  const { data } = await apiClient.get<CourseRiskResponse>(`/courses/${courseId}/risk`);
  return data;
};

export const predictCourseRisk = async (courseId: string) => {
  const { data } = await apiClient.post<CourseRiskResponse>(`/courses/${courseId}/predict`);
  return data;
};

export const getCourseSuggestions = async (courseId: string) => {
  const { data } = await apiClient.get(`/courses/${courseId}/suggestions`);
  return data as {
    courseId: string;
    suggestions: Array<{
      title: string;
      why: string;
      actions: string[];
      expectedImpact?: string;
    }>;
    createdAt: string;
  };
};
