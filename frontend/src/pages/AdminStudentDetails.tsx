import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminStudent } from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';
import { getRiskBucket } from '../utils/risk';

type BucketFilter = 'all' | 'green' | 'yellow' | 'red';
type SortOrder = 'asc' | 'desc';

export const AdminStudentDetails = () => {
  const { id = '' } = useParams();
  const [bucket, setBucket] = useState<BucketFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const query = useQuery({
    queryKey: ['admin-student', id],
    queryFn: () => getAdminStudent(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <Skeleton className="h-80" />;
  if (query.isError || !query.data) return <p className="text-sm font-medium text-red-600">Failed to load student details.</p>;

  const rows = useMemo(() => {
    const filtered = query.data.courses.filter((course) => (bucket === 'all' ? true : getRiskBucket(course.probabilityFail) === bucket));
    return filtered.sort((a, b) =>
      sortOrder === 'desc' ? b.probabilityFail - a.probabilityFail : a.probabilityFail - b.probabilityFail,
    );
  }, [query.data.courses, bucket, sortOrder]);

  const avgRisk = rows.length ? rows.reduce((sum, row) => sum + row.probabilityFail, 0) / rows.length : 0;

  return (
    <div className="space-y-6">
      <Card className="hero-bg relative overflow-hidden border-0 p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/admin/dashboard" className="inline-block rounded-2xl border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20">
              Back to admin dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold">{query.data.fullName ?? query.data.email}</h1>
            <p className="text-sm text-blue-100">{query.data.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric title="Courses" value={String(rows.length)} />
            <Metric title="Avg Risk" value={formatPercent(avgRisk)} />
            <Metric title="High Risk" value={String(rows.filter((row) => row.probabilityFail >= 0.66).length)} />
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-4">
        <div className="flex flex-wrap gap-2">
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
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="desc">Risk desc</option>
            <option value="asc">Risk asc</option>
          </select>
        </div>
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
            {rows.map((course) => (
              <tr key={course.courseId} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  <p className="text-xs text-slate-500">{course.courseId}</p>
                </td>
                <td className="px-4 py-3">{Number(course.weightedPercent ?? 0).toFixed(1)}%</td>
                <td className="px-4 py-3">{formatPercent(course.probabilityFail)}</td>
                <td className="px-4 py-3">
                  <Badge bucket={course.bucket} />
                </td>
                <td className="px-4 py-3">{course.totalAbsences ?? 0}</td>
                <td className={`px-4 py-3 font-semibold ${course.canStillPass ? 'text-emerald-700' : 'text-red-700'}`}>
                  {course.canStillPass ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                  No courses match selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const Metric = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-right">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">{title}</p>
    <p className="text-lg font-bold text-white">{value}</p>
  </div>
);
