import { StudentProfile } from '../../types';
import { Card } from '../ui/Card';

export const RiskStats = ({ students }: { students: StudentProfile[] }) => {
  const high = students.filter((student) => (student.latestProbability ?? 0) >= 0.66).length;
  const medium = students.filter((student) => {
    const p = student.latestProbability ?? 0;
    return p >= 0.33 && p < 0.66;
  }).length;
  const low = students.filter((student) => (student.latestProbability ?? 0) < 0.33).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-5">
        <p className="text-sm text-slate-500">High Risk</p>
        <p className="mt-1 text-3xl font-bold text-red-600">{high}</p>
      </Card>
      <Card className="p-5">
        <p className="text-sm text-slate-500">Medium Risk</p>
        <p className="mt-1 text-3xl font-bold text-amber-600">{medium}</p>
      </Card>
      <Card className="p-5">
        <p className="text-sm text-slate-500">Low Risk</p>
        <p className="mt-1 text-3xl font-bold text-emerald-600">{low}</p>
      </Card>
    </div>
  );
};
