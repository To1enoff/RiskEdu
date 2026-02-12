import { RiskBucket } from '../types';

export function toPercent(probability?: number): string {
  if (probability === undefined || probability === null || Number.isNaN(probability)) {
    return 'N/A';
  }
  return `${(probability * 100).toFixed(1)}%`;
}

export function bucketLabel(bucket?: RiskBucket): string {
  if (!bucket) {
    return 'Unknown';
  }
  return bucket.charAt(0).toUpperCase() + bucket.slice(1);
}

export function scoreToBucket(probability: number): RiskBucket {
  if (probability < 0.33) {
    return 'green';
  }
  if (probability < 0.66) {
    return 'yellow';
  }
  return 'red';
}
