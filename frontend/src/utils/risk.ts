import { RiskBucket } from '../types';

// Centralized risk bucket logic keeps frontend aligned with backend product rules.
export const getRiskBucket = (probability: number): RiskBucket => {
  if (probability < 0.33) {
    return 'green';
  }
  if (probability < 0.66) {
    return 'yellow';
  }
  return 'red';
};

export const riskBucketLabel = (bucket: RiskBucket) => {
  if (bucket === 'green') return 'Low Risk';
  if (bucket === 'yellow') return 'Medium Risk';
  return 'High Risk';
};
