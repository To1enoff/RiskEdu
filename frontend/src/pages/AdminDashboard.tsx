import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminStudents } from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getRiskBucket } from '../utils/risk';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';

type BucketFilter = 'all' | 'green' | 'yellow' | 'red';
type SortField = 'risk' | 'weighted' | 'absences' | 'student';
type SortOrder = 'asc' | 'desc';

export const AdminDashboard = () => {
  const [bucket, setBucket] = useState<BucketFilter>('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const query = useQuery({
    queryKey: ['admin-students', bucket, highRiskOnly, sortOrder],
    queryFn: () =>
      getAdminStudents({
        sort: sortOrder,
        bucket: bucket === 'all' ? undefined : bucket,
        highRiskOnly: highRiskOnly || undefined,
        limit: 500,
      }),
  });

  const rawRows = query.data?.items ?? [];
  const courseOptions = useMemo(() => {
    return Array.from(
      new Map(rawRows.map((row) => [row.courseId, { id: row.courseId, title: row.courseTitle }])).values(),
    ).sort((a, b) => a.title.localeCompare(b.title));
  }, [rawRows]);

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = rawRows.filter((row) => {
      const matchCourse = !courseFilter || row.courseId === courseFilter;
      if (!matchCourse) return false;
      if (!normalizedSearch) return true;
      const target = `${row.studentName} ${row.studentEmail ?? ''} ${row.courseTitle} ${row.courseId}`.toLowerCase();
      return target.includes(normalizedSearch);
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'risk') return (a.probabilityFail - b.probabilityFail) * direction;
      if (sortField === 'weighted') return (a.weightedPercent - b.weightedPercent) * direction;
      if (sortField === 'absences') return (a.totalAbsences - b.totalAbsences) * direction;
      return a.studentName.localeCompare(b.studentName) * direction;
    });
    return sorted;
  }, [rawRows, search, courseFilter, sortField, sortOrder]);

  const stats = useMemo(() => {
    const red = rows.filter((row) => getRiskBucket(row.probabilityFail) === 'red').length;
    const yellow = rows.filter((row) => getRiskBucket(row.probabilityFail) === 'yellow').length;
    const green = rows.filter((row) => getRiskBucket(row.probabilityFail) === 'green').length;
    const avgRisk = rows.length ? rows.reduce((sum, row) => sum + row.probabilityFail, 0) / rows.length : 0;
    return { red, yellow, green, avgRisk, total: rows.length };
  }, [rows]);

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError) return <p className="text-sm font-medium text-red-600">Failed to load admin risk dashboard.</p>;

  return (
    <div className="space-y-6">
      <Card className="hero-bg relative overflow-hidden border-0 p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-blue-100">Read-only aggregated risk by student and course with live prioritization.</p>
          </div>
          <Stat title="Total Rows" value={String(stats.total)} />
          <Stat title="Average Risk" value={formatPercent(stats.avgRisk)} />
          <div className="grid grid-cols-3 gap-2">
            <Stat title="Red" value={String(stats.red)} compact />
            <Stat title="Yellow" value={String(stats.yellow)} compact />
            <Stat title="Green" value={String(stats.green)} compact />
          </div>
        </div>
      </Card>

      <Card variant="glass" className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Student, email, course..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bucket</span>
            <select
              value={bucket}
              onChange={(event) => setBucket(event.target.value as BucketFilter)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All buckets</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Course</span>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All courses</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort by</span>
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as SortField)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="risk">Risk</option>
              <option value="weighted">Weighted %</option>
              <option value="absences">Absences</option>
              <option value="student">Student</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Order</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sortOrder === 'desc' ? 'solid' : 'outline'}
                className="w-full px-3 py-2 text-xs"
                onClick={() => setSortOrder('desc')}
              >
                Desc
              </Button>
              <Button
                type="button"
                variant={sortOrder === 'asc' ? 'solid' : 'outline'}
                className="w-full px-3 py-2 text-xs"
                onClick={() => setSortOrder('asc')}
              >
                Asc
              </Button>
            </div>
          </label>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={highRiskOnly}
            onChange={(event) => setHighRiskOnly(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          High risk only (&gt;= 66%)
        </label>
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
            {rows.map((row) => (
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
                <td className="px-4 py-3">{Number(row.weightedPercent ?? 0).toFixed(1)}%</td>
                <td className="px-4 py-3">{formatPercent(row.probabilityFail)}</td>
                <td className="px-4 py-3">
                  <Badge bucket={row.bucket} />
                </td>
                <td className="px-4 py-3">{row.totalAbsences ?? 0}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={6}>
                  No matching rows for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const Stat = ({ title, value, compact = false }: { title: string; value: string; compact?: boolean }) => (
  <div className={`rounded-2xl border border-white/20 bg-white/10 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
    <p className={`uppercase tracking-wide text-blue-100 ${compact ? 'text-[10px]' : 'text-xs'}`}>{title}</p>
    <p className={`font-bold text-white ${compact ? 'text-lg' : 'text-2xl'}`}>{value}</p>
  </div>
);
