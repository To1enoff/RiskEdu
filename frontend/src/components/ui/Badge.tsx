import { RiskBucket } from '../../types';
import { riskBucketLabel } from '../../utils/risk';

const colors: Record<RiskBucket, string> = {
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
};

export const Badge = ({ bucket }: { bucket: RiskBucket }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[bucket]}`}>
    {riskBucketLabel(bucket)}
  </span>
);
