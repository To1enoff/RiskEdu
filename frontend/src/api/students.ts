import { apiClient } from './client';
import {
  PredictResponse,
  StudentProfile,
  StudentsResponse,
  WhatIfResponse,
} from '../types';

export interface StudentsQuery {
  page?: number;
  limit?: number;
  riskBucket?: 'green' | 'yellow' | 'red';
  sort?: 'asc' | 'desc';
}

export async function fetchStudents(query: StudentsQuery): Promise<StudentsResponse> {
  const { data } = await apiClient.get<StudentsResponse>('/students', { params: query });
  return data;
}

export async function fetchStudentById(id: string): Promise<StudentProfile> {
  const { data } = await apiClient.get<StudentProfile>(`/students/${id}`);
  return data;
}

export async function predictStudent(payload: {
  studentId?: string;
  externalStudentId?: string;
  fullName?: string;
  department?: string;
  features: Record<string, unknown>;
}): Promise<PredictResponse> {
  const { data } = await apiClient.post<PredictResponse>('/predict', payload);
  return data;
}

export async function runWhatIf(payload: {
  studentId?: string;
  baselineFeatures: Record<string, unknown>;
  overrides: Record<string, unknown>;
}): Promise<WhatIfResponse> {
  const { data } = await apiClient.post<WhatIfResponse>('/whatif', payload);
  return data;
}
