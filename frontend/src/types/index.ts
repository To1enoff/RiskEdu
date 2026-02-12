export type UserRole = 'admin' | 'advisor' | 'instructor';
export type RiskBucket = 'green' | 'yellow' | 'red';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ExplanationItem {
  featureKey: string;
  displayName: string;
  contribution: number;
  direction: 'increase_risk' | 'decrease_risk';
  value?: string | number | null;
}

export interface StudentProfile {
  id: string;
  externalStudentId?: string;
  fullName?: string;
  department?: string;
  features: Record<string, unknown>;
  latestProbability?: number;
  latestBucket?: RiskBucket;
  latestLabel?: number;
  latestExplanations?: ExplanationItem[];
  lastPredictionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentsResponse {
  items: StudentProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PredictResponse {
  studentId: string;
  probability: number;
  label: number;
  bucket: RiskBucket;
  explanations: ExplanationItem[];
}

export interface WhatIfChangedFeature {
  featureKey: string;
  displayName: string;
  oldValue: string | number | null;
  newValue: string | number | null;
}

export interface WhatIfResponse {
  baselineProbability: number;
  newProbability: number;
  delta: number;
  bucket: RiskBucket;
  changedFeatures: WhatIfChangedFeature[];
  explanations: ExplanationItem[];
}

export interface FeatureImportanceItem {
  featureKey: string;
  displayName: string;
  score: number;
}

export interface FeatureImportanceResponse {
  source: string;
  department: string | null;
  features: FeatureImportanceItem[];
}
