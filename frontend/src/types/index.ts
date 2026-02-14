export type UserRole = 'admin' | 'advisor' | 'instructor' | 'student';
export type RiskBucket = 'green' | 'yellow' | 'red';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  studentProfileId?: string;
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
  updatedAt?: string;
}

export interface StudentsResponse {
  items: StudentProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WhatIfResponse {
  baselineProbability: number;
  newProbability: number;
  delta: number;
  bucket: RiskBucket;
  changedFeatures: Array<{
    featureKey: string;
    displayName: string;
    oldValue: string | number | null;
    newValue: string | number | null;
  }>;
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

export interface CourseWeightInput {
  midterm: number;
  final: number;
  quizzes: number;
  assignments: number;
  projects?: number;
}

export interface Course {
  id: string;
  title: string;
  ownerUserId: string;
  weeks: number;
  createdAt: string;
}

export interface CourseRiskResponse {
  courseId: string;
  title: string;
  weightedPercent: number;
  remainingWeight: number;
  maxAchievablePercent: number;
  canStillPass: boolean;
  totalAbsences: number;
  absenceStatus: 'ok' | 'warning' | 'critical' | 'auto_fail';
  probabilityFail: number;
  bucket: RiskBucket;
  isAutoFail: boolean;
  reasons: string[];
  features: {
    weightedPercent: number;
    remainingWeight: number;
    maxAchievablePercent: number;
    totalAbsences: number;
    absencesRate: number;
    missingWeeksCount: number;
    examCompletedRatio: number;
    quizTrend: number;
  };
  suggestions: Array<{
    title: string;
    why: string;
    actions: string[];
    expectedImpact?: string;
  }>;
  createdAt: string;
}
