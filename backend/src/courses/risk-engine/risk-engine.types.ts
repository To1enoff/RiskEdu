import { RiskBucket } from '../../common/enums/risk-bucket.enum';

export interface CourseRiskFeatures {
  [key: string]: number;
  weightedPercent: number;
  remainingWeight: number;
  maxAchievablePercent: number;
  totalAbsences: number;
  absencesRate: number;
  missingWeeksCount: number;
  examCompletedRatio: number;
  quizTrend: number;
}

export interface CourseRiskCalculationInput {
  weightedPercent: number;
  remainingWeight: number;
  maxAchievablePercent: number;
  totalAbsences: number;
  missingWeeksCount: number;
  examCompletedRatio: number;
  quizTrend: number;
  allComponentsCompleted: boolean;
  mlProbability?: number;
}

export interface CourseRiskResult {
  probabilityFail: number;
  bucket: RiskBucket;
  isAutoFail: boolean;
  reasons: string[];
  features: CourseRiskFeatures;
}
