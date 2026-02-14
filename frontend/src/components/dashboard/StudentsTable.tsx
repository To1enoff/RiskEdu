import { Link } from 'react-router-dom';
import { StudentProfile } from '../../types';
import { formatDateTime, formatPercent } from '../../utils/format';
import { getRiskBucket } from '../../utils/risk';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const StudentsTable = ({ students }: { students: StudentProfile[] }) => {
  if (!students.length) {
    return (
      <Card className="p-6 text-slate-500">
        No students found for selected filters. Run `/predict` to populate risk entries.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Bucket</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const bucket = getRiskBucket(student.latestProbability ?? 0);
              const displayName =
                student.fullName ?? student.externalStudentId ?? `Student ${student.id.slice(0, 8)}`;

              return (
                <tr key={student.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{displayName}</p>
                    <p className="text-xs text-slate-500">{student.externalStudentId ?? student.id}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {formatPercent(student.latestProbability)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge bucket={bucket} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(student.lastPredictionAt)}</td>
                  <td className="px-4 py-3">
                    <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" to={`/students/${student.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
