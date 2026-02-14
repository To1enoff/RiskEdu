import { useState } from 'react';
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
      setTitle('');
      await queryClient.invalidateQueries({ queryKey: ['student-courses'] });
    },
  });

  if (coursesQuery.isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (coursesQuery.isError) {
    return <p className="text-sm font-medium text-red-600">Failed to load your courses.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <p className="mt-1 text-sm text-slate-500">Risk prediction and what-if are scoped per course.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-[220px]"
            placeholder="New course title"
          />
          <Button
            onClick={() => createCourseMutation.mutate()}
            disabled={createCourseMutation.isPending || !title.trim()}
          >
            {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coursesQuery.data?.map((course) => (
          <Link key={course.id} to={`/student/courses/${course.id}`}>
            <Card className="h-full p-5 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                <Badge bucket={course.bucket} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Weighted: {course.weightedPercent.toFixed(1)}%</p>
                <p>Risk: {formatPercent(course.probabilityFail)}</p>
                <p>Absences: {course.totalAbsences} ({course.absenceStatus})</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {coursesQuery.data?.length === 0 && <p className="text-sm text-slate-500">Create your first course to start tracking.</p>}
    </div>
  );
};
