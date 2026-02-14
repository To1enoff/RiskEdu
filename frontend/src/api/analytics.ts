import { FeatureImportanceResponse } from '../types';
import { apiClient } from './client';

export const getFeatureImportance = async (department?: string) => {
  const { data } = await apiClient.get<FeatureImportanceResponse>('/analytics/feature-importance', {
    params: department ? { department } : undefined,
  });
  return data;
};
