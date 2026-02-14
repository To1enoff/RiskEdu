import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { createCourse, getCourses } from '../api/courses';
import { getStudents } from '../api/students';
import { FiltersBar } from '../components/dashboard/FiltersBar';
import { RiskStats } from '../components/dashboard/RiskStats';
import { RiskTrendChart } from '../components/dashboard/RiskTrendChart';
import { StudentsTable } from '../components/dashboard/StudentsTable';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { getRiskBucket } from '../utils/risk';

type BucketFilter = 'all' | 'green' | 'yellow' | 'red';

export const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('all');
  const [search, setSearch] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('Math 101');

  const studentsQuery = useQuery({
    queryKey: ['students', 'dashboard'],
    queryFn: () => getStudents({ page: 1, limit: 200, sort: 'desc' }),
    enabled: user?.role !== 'student',
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    enabled: user?.role !== 'student',
  });

  const createCourseMutation = useMutation({
    mutationFn: () => createCourse(newCourseTitle),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
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

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Weighted Course Workspace</h2>
            <p className="text-sm text-slate-500">
              Create course and manage syllabus, weeks, exams, risk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newCourseTitle}
              onChange={(event) => setNewCourseTitle(event.target.value)}
              className="min-w-[220px]"
              placeholder="Course title"
            />
            <Button
              onClick={() => createCourseMutation.mutate()}
              disabled={createCourseMutation.isPending || !newCourseTitle.trim()}
            >
              {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(coursesQuery.data ?? []).map((course) => (
            <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{course.title}</p>
              <p className="text-xs text-slate-500">{course.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/student/courses/${course.id}/syllabus`} className="text-sm text-blue-600">
                  Syllabus
                </Link>
                <Link to={`/student/courses/${course.id}/weeks`} className="text-sm text-blue-600">
                  Weeks
                </Link>
                <Link to={`/student/courses/${course.id}/exams`} className="text-sm text-blue-600">
                  Exams
                </Link>
                <Link to={`/student/courses/${course.id}/risk`} className="text-sm text-blue-600">
                  Risk
                </Link>
              </div>
            </div>
          ))}
          {coursesQuery.data?.length === 0 && (
            <p className="text-sm text-slate-500">No courses yet. Create one to start 15-week tracking.</p>
          )}
        </div>
      </Card>

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
