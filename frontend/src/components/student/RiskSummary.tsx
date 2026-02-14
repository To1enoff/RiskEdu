import { StudentProfile } from '../../types';
import { formatDateTime, formatPercent } from '../../utils/format';
import { getRiskBucket } from '../../utils/risk';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const RiskSummary = ({ student }: { student: StudentProfile }) => {
  const probability = student.latestProbability ?? 0;
  const bucket = getRiskBucket(probability);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {student.fullName ?? student.externalStudentId ?? student.id}
          </h2>
          <p className="text-sm text-slate-500">{student.externalStudentId ?? student.id}</p>
        </div>
        <Badge bucket={bucket} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-slate-500">Risk Probability</p>
          <p className="text-3xl font-bold text-slate-900">{formatPercent(student.latestProbability)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Department</p>
          <p className="text-lg font-semibold text-slate-800">{student.department ?? '-'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Last Prediction</p>
          <p className="text-lg font-semibold text-slate-800">{formatDateTime(student.lastPredictionAt)}</p>
        </div>
      </div>
    </Card>
  );
};
