import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getWeeks, submitWeek } from '../api/courses';
import { CourseNav } from '../components/student/CourseNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';

interface WeekState {
  weekNumber: number;
  quizScore: number | '';
  assignmentScore: number | '';
  absenceCountWeek: number;
  submittedAt?: string | null;
}

export const CourseWeeks = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [weeks, setWeeks] = useState<WeekState[]>([]);

  const weeksQuery = useQuery({
    queryKey: ['course-weeks', id],
    queryFn: () => getWeeks(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!weeksQuery.data) {
      return;
    }
    setWeeks(
      weeksQuery.data.map((week) => ({
        weekNumber: week.weekNumber,
        quizScore: week.quizScore ?? '',
        assignmentScore: week.assignmentScore ?? '',
        absenceCountWeek: week.absenceCountWeek ?? 0,
        submittedAt: week.submittedAt,
      })),
    );
  }, [weeksQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (week: WeekState) =>
      submitWeek(id, week.weekNumber, {
        quizScore: week.quizScore === '' ? undefined : Number(week.quizScore),
        assignmentScore: week.assignmentScore === '' ? undefined : Number(week.assignmentScore),
        absenceCountWeek: Number(week.absenceCountWeek ?? 0),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-weeks', id] });
    },
  });

  if (weeksQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">15-Week Tracking</h1>
        <Link to="/dashboard" className="text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>

      <CourseNav courseId={id} />

      <Card className="overflow-hidden p-4">
        <div className="grid gap-3 md:grid-cols-2">
          {weeks.map((week) => (
            <div key={week.weekNumber} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-3 text-base font-semibold text-slate-800">Week {week.weekNumber}</h3>
              <div className="grid gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Quiz score"
                  value={week.quizScore}
                  onChange={(event) =>
                    setWeeks((prev) =>
                      prev.map((item) =>
                        item.weekNumber === week.weekNumber
                          ? {
                              ...item,
                              quizScore:
                                event.target.value === '' ? '' : Number(event.target.value),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Assignment score"
                  value={week.assignmentScore}
                  onChange={(event) =>
                    setWeeks((prev) =>
                      prev.map((item) =>
                        item.weekNumber === week.weekNumber
                          ? {
                              ...item,
                              assignmentScore:
                                event.target.value === '' ? '' : Number(event.target.value),
                            }
                          : item,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={30}
                  placeholder="Absence count"
                  value={week.absenceCountWeek}
                  onChange={(event) =>
                    setWeeks((prev) =>
                      prev.map((item) =>
                        item.weekNumber === week.weekNumber
                          ? {
                              ...item,
                              absenceCountWeek: Number(event.target.value || 0),
                            }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="outline"
                  className="px-4 py-2"
                  onClick={() => saveMutation.mutate(week)}
                  disabled={saveMutation.isPending}
                >
                  Save week
                </Button>
                {week.submittedAt && (
                  <span className="text-xs text-slate-500">
                    Updated {new Date(week.submittedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {saveMutation.isError && <p className="mt-3 text-sm font-medium text-red-600">Failed to save week.</p>}
      </Card>
    </div>
  );
};
