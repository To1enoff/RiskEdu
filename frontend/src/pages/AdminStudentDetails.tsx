import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminStudent } from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';

export const AdminStudentDetails = () => {
  const { id = '' } = useParams();

  const query = useQuery({
    queryKey: ['admin-student', id],
    queryFn: () => getAdminStudent(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <Skeleton className="h-80" />;
  if (query.isError || !query.data) return <p className="text-sm font-medium text-red-600">Failed to load student details.</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/dashboard" className="text-sm font-semibold text-blue-600">
        Back to admin dashboard
      </Link>

      <Card className="p-6">
        <h1 className="text-3xl font-bold text-slate-900">{query.data.fullName ?? query.data.email}</h1>
        <p className="mt-1 text-sm text-slate-500">{query.data.email}</p>
      </Card>

      <Card className="overflow-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Weighted %</th>
              <th className="px-4 py-3 font-semibold">Risk %</th>
              <th className="px-4 py-3 font-semibold">Bucket</th>
              <th className="px-4 py-3 font-semibold">Absences</th>
              <th className="px-4 py-3 font-semibold">Can still pass</th>
            </tr>
          </thead>
          <tbody>
            {query.data.courses.map((course) => (
              <tr key={course.courseId} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.courseId}</p>
                </td>
                <td className="px-4 py-3">{course.weightedPercent.toFixed(1)}%</td>
                <td className="px-4 py-3">{formatPercent(course.probabilityFail)}</td>
                <td className="px-4 py-3">
                  <Badge bucket={course.bucket} />
                </td>
                <td className="px-4 py-3">{course.totalAbsences}</td>
                <td className={`px-4 py-3 font-semibold ${course.canStillPass ? 'text-emerald-700' : 'text-red-700'}`}>
                  {course.canStillPass ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
