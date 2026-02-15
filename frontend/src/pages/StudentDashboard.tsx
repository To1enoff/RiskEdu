import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createStudentCourse, getStudentCourses } from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';

export const StudentDashboard = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('Math 101');

  const coursesQuery = useQuery({
    queryKey: ['student-courses'],
    queryFn: getStudentCourses,
  });

  const createCourseMutation = useMutation({
    mutationFn: () => createStudentCourse(title.trim()),
    onSuccess: async () => {
      setTitle('Math 101');
      await queryClient.invalidateQueries({ queryKey: ['student-courses'] });
    },
  });

  if (coursesQuery.isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (coursesQuery.isError) {
    return <p className="text-sm font-medium text-red-600">Failed to load your courses.</p>;
  }

  const courses = coursesQuery.data ?? [];
  const stats = useMemo(() => {
    const red = courses.filter((course) => course.bucket === 'red').length;
    const yellow = courses.filter((course) => course.bucket === 'yellow').length;
    const green = courses.filter((course) => course.bucket === 'green').length;
    const avgRisk = courses.length
      ? courses.reduce((sum, course) => sum + course.probabilityFail, 0) / courses.length
      : 0;
    return { red, yellow, green, avgRisk };
  }, [courses]);

  return (
    <div className="space-y-6">
      <Card className="hero-bg relative overflow-hidden border-0 p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">My Courses</h1>
            <p className="mt-2 text-sm text-blue-100">Course-scoped risk prediction and what-if simulation.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-blue-100">Avg risk</p>
                <p className="text-2xl font-bold text-white">{formatPercent(stats.avgRisk)}</p>
              </div>
              <div className="rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-red-100">Red</p>
                <p className="text-2xl font-bold text-white">{stats.red}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-amber-100">Yellow</p>
                <p className="text-2xl font-bold text-white">{stats.yellow}</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-100">Green</p>
                <p className="text-2xl font-bold text-white">{stats.green}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Create a new course</p>
            <p className="mt-1 text-sm text-slate-600">Weights, weeks, exams, risk and what-if are managed inside course overview.</p>
            <div className="mt-4 space-y-3">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="border-white/60 bg-white/70"
                placeholder="New course title"
              />
              <Button
                onClick={() => createCourseMutation.mutate()}
                disabled={createCourseMutation.isPending || !title.trim()}
                className="w-full"
              >
                {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, index) => (
          <Card
            key={course.id}
            variant="glass"
            className="animate-in h-full border-white/50 bg-white/75 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-glass"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <Link to={`/student/courses/${course.id}`}>
                <h2 className="text-xl font-semibold text-slate-900 hover:text-blue-700">{course.title}</h2>
              </Link>
              <Badge bucket={course.bucket} />
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl border border-white/70 bg-white/60 p-3 text-sm text-slate-600">
              <p>Weighted: {course.weightedPercent.toFixed(1)}%</p>
              <p>Risk: {formatPercent(course.probabilityFail)}</p>
              <p>Absences: {course.totalAbsences} ({course.absenceStatus})</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">Open Overview to edit syllabus, weeks, exams and delete this course.</p>
              <Link to={`/student/courses/${course.id}`}>
                <Button variant="outline">Open</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {courses.length === 0 && (
        <Card variant="glass" className="p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses yet</p>
          <p className="mt-2 text-sm text-slate-600">Create your first course from the panel above to start weekly tracking and risk forecasting.</p>
        </Card>
      )}
    </div>
  );
};
