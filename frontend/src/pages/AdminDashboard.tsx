import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminStudents } from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';

type BucketFilter = 'all' | 'green' | 'yellow' | 'red';

export const AdminDashboard = () => {
  const [bucket, setBucket] = useState<BucketFilter>('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  const query = useQuery({
    queryKey: ['admin-students', bucket, courseFilter, highRiskOnly],
    queryFn: () =>
      getAdminStudents({
        sort: 'desc',
        bucket: bucket === 'all' ? undefined : bucket,
        courseId: courseFilter || undefined,
        highRiskOnly: highRiskOnly || undefined,
      }),
  });

  const courseOptions = useMemo(
    () => Array.from(new Set((query.data?.items ?? []).map((row) => row.courseId))),
    [query.data],
  );

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError) return <p className="text-sm font-medium text-red-600">Failed to load admin risk dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Read-only aggregated course risks by student.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bucket}
            onChange={(event) => setBucket(event.target.value as BucketFilter)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All buckets</option>
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
            <option value="green">Green</option>
          </select>
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All courses</option>
            {courseOptions.map((courseId) => (
              <option key={courseId} value={courseId}>
                {courseId}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Input type="checkbox" checked={highRiskOnly} onChange={(event) => setHighRiskOnly(event.target.checked)} className="h-4 w-4" />
            High risk only
          </label>
        </div>
      </Card>

      <Card className="overflow-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Weighted %</th>
              <th className="px-4 py-3 font-semibold">Risk %</th>
              <th className="px-4 py-3 font-semibold">Bucket</th>
              <th className="px-4 py-3 font-semibold">Absences</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.items ?? []).map((row) => (
              <tr key={`${row.studentId}-${row.courseId}`} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link to={`/admin/students/${row.studentId}`} className="font-semibold text-blue-600">
                    {row.studentName}
                  </Link>
                  <p className="text-xs text-slate-500">{row.studentEmail ?? 'N/A'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{row.courseTitle}</p>
                  <p className="text-xs text-slate-500">{row.courseId}</p>
                </td>
                <td className="px-4 py-3">{row.weightedPercent.toFixed(1)}%</td>
                <td className="px-4 py-3">{formatPercent(row.probabilityFail)}</td>
                <td className="px-4 py-3">
                  <Badge bucket={row.bucket} />
                </td>
                <td className="px-4 py-3">{row.totalAbsences}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
