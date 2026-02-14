import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { getStudents } from '../api/students';
import { FiltersBar } from '../components/dashboard/FiltersBar';
import { RiskStats } from '../components/dashboard/RiskStats';
import { RiskTrendChart } from '../components/dashboard/RiskTrendChart';
import { StudentsTable } from '../components/dashboard/StudentsTable';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { getRiskBucket } from '../utils/risk';

type BucketFilter = 'all' | 'green' | 'yellow' | 'red';

export const Dashboard = () => {
  const { user } = useAuth();
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all');
  const [search, setSearch] = useState('');

  const studentsQuery = useQuery({
    queryKey: ['students', 'dashboard'],
    queryFn: () => getStudents({ page: 1, limit: 200, sort: 'desc' }),
    enabled: user?.role !== 'student',
  });

  if (user?.role === 'student' && user.studentProfileId) {
    return <Navigate to={`/students/${user.studentProfileId}`} replace />;
  }

  const students = studentsQuery.data?.items ?? [];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const bucket = getRiskBucket(student.latestProbability ?? 0);
      const matchesBucket = bucketFilter === 'all' || bucket === bucketFilter;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (student.fullName ?? '').toLowerCase().includes(query) ||
        (student.externalStudentId ?? '').toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query);
      return matchesBucket && matchesSearch;
    });
  }, [students, bucketFilter, search]);

  if (studentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-20" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (studentsQuery.isError) {
    return <p className="text-sm font-medium text-red-600">Failed to load students.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Risk Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Prioritize interventions by fail probability.</p>
      </div>
      <RiskStats students={students} />
      <FiltersBar
        search={search}
        onSearchChange={setSearch}
        bucket={bucketFilter}
        onBucketChange={setBucketFilter}
      />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <StudentsTable students={filteredStudents} />
        <RiskTrendChart students={students} />
      </div>
    </div>
  );
};
