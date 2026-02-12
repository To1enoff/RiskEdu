import { RiskBucket } from '../types';
import { bucketLabel } from '../utils/format';

export function RiskChip({ bucket }: { bucket?: RiskBucket }) {
  return (
    <span className={`risk-chip ${bucket ?? 'unknown'}`}>
      {bucketLabel(bucket)}
    </span>
  );
}
