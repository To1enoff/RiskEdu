import { apiClient } from './client';
import { FeatureImportanceResponse } from '../types';

export async function fetchFeatureImportance(department?: string): Promise<FeatureImportanceResponse> {
  const { data } = await apiClient.get<FeatureImportanceResponse>('/analytics/feature-importance', {
    params: department ? { department } : {},
  });
  return data;
}
