import { StudentProfile, StudentsResponse, WhatIfResponse } from '../types';
import { apiClient } from './client';

export interface StudentsQueryParams {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  riskBucket?: 'green' | 'yellow' | 'red';
}

export const getStudents = async (params: StudentsQueryParams = {}) => {
  const { data } = await apiClient.get<StudentsResponse>('/students', { params });
  return data;
};

export const getStudentById = async (id: string) => {
  const { data } = await apiClient.get<StudentProfile>(`/students/${id}`);
  return data;
};

export const getMyStudentProfile = async () => {
  const { data } = await apiClient.get<StudentProfile>('/students/me');
  return data;
};

export const runWhatIf = async (payload: {
  studentId?: string;
  baselineFeatures: Record<string, unknown>;
  overrides: Record<string, unknown>;
}) => {
  const { data } = await apiClient.post<WhatIfResponse>('/whatif', payload);
  return data;
};
