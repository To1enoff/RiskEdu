import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getCourseRisk, predictCourseRisk } from '../api/courses';
import { CourseNav } from '../components/student/CourseNav';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPercent } from '../utils/format';

export const CourseRisk = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();

  const riskQuery = useQuery({
    queryKey: ['course-risk', id],
    queryFn: () => getCourseRisk(id),
    enabled: Boolean(id),
  });

  const predictMutation = useMutation({
    mutationFn: () => predictCourseRisk(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-risk', id] });
    },
  });

  if (riskQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (riskQuery.isError || !riskQuery.data) {
    return <p className="text-sm font-medium text-red-600">Failed to load course risk.</p>;
  }

  const risk = riskQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Course Risk</h1>
        <Link to="/dashboard" className="text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>

      <CourseNav courseId={id} />

      {risk.totalAbsences > 30 && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          Auto fail: absences exceed 30.
        </Card>
      )}
      {risk.maxAchievablePercent < 50 && (
        <Card className="border-red-200 bg-red-50 p-4 text-red-700">
          Cannot reach passing grade (max achievable below 50%).
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Weighted percent</p>
            <p className="text-5xl font-bold text-slate-900">{risk.weightedPercent.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <Badge bucket={risk.bucket} />
            <p className="text-sm text-slate-600">Risk probability: {formatPercent(risk.probabilityFail)}</p>
            <p
              className={`text-sm font-semibold ${
                risk.canStillPass ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {risk.canStillPass ? 'Can still pass' : 'Cannot still pass'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Metric title="Remaining weight" value={`${risk.remainingWeight.toFixed(1)}%`} />
          <Metric title="Max achievable" value={`${risk.maxAchievablePercent.toFixed(1)}%`} />
          <Metric title="Absences" value={`${risk.totalAbsences} (${risk.absenceStatus})`} />
        </div>

        <div className="mt-5">
          <Button onClick={() => predictMutation.mutate()} disabled={predictMutation.isPending}>
            {predictMutation.isPending ? 'Predicting...' : 'Recalculate risk'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Reasons</h2>
        {risk.reasons.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No major risk reasons detected.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-slate-700">
            {risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">AI Suggestions</h2>
        {risk.suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Suggestions will appear after running course prediction.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {risk.suggestions.map((suggestion) => (
              <div key={suggestion.title} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">{suggestion.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{suggestion.why}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {suggestion.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                {suggestion.expectedImpact && (
                  <p className="mt-2 text-xs font-medium text-indigo-700">{suggestion.expectedImpact}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const Metric = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">{title}</p>
    <p className="mt-1 text-lg font-semibold text-slate-800">{value}</p>
  </div>
);
