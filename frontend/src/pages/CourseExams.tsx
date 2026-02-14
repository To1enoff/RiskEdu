import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getExams, submitExam } from '../api/courses';
import { CourseNav } from '../components/student/CourseNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

export const CourseExams = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [midterm, setMidterm] = useState<number | ''>('');
  const [finalExam, setFinalExam] = useState<number | ''>('');

  const examsQuery = useQuery({
    queryKey: ['course-exams', id],
    queryFn: () => getExams(id),
    enabled: Boolean(id),
  });

  const mapped = useMemo(() => {
    const exams = examsQuery.data?.exams ?? [];
    return {
      midterm: exams.find((exam) => exam.type === 'midterm')?.score ?? null,
      final: exams.find((exam) => exam.type === 'final')?.score ?? null,
    };
  }, [examsQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (midterm !== '') {
        await submitExam(id, { type: 'midterm', score: Number(midterm) });
      }
      if (finalExam !== '') {
        await submitExam(id, { type: 'final', score: Number(finalExam) });
      }
    },
    onSuccess: async () => {
      setMidterm('');
      setFinalExam('');
      await queryClient.invalidateQueries({ queryKey: ['course-exams', id] });
    },
  });

  if (examsQuery.isLoading) {
    return <Skeleton className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Exams</h1>
        <Link to="/dashboard" className="text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>

      <CourseNav courseId={id} />

      <Card className="space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Midterm</p>
            <Input
              type="number"
              min={0}
              max={100}
              value={midterm}
              placeholder={mapped.midterm === null ? 'Enter score' : `Current: ${mapped.midterm}`}
              onChange={(event) =>
                setMidterm(event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Final</p>
            <Input
              type="number"
              min={0}
              max={100}
              value={finalExam}
              placeholder={mapped.final === null ? 'Enter score' : `Current: ${mapped.final}`}
              onChange={(event) =>
                setFinalExam(event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </div>
        </div>

        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save exams'}
        </Button>
        {mutation.isError && <p className="text-sm text-red-600">Failed to save exam data.</p>}
      </Card>
    </div>
  );
};
