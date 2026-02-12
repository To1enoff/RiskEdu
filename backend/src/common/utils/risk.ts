import { RiskBucket } from '../enums/risk-bucket.enum';

export function getRiskBucket(probability: number): RiskBucket {
  if (probability < 0.33) {
    return RiskBucket.GREEN;
  }
  if (probability < 0.66) {
    return RiskBucket.YELLOW;
  }
  return RiskBucket.RED;
}
