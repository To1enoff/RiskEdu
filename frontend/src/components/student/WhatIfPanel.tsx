import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runWhatIf } from '../../api/students';
import { WhatIfResponse } from '../../types';
import { formatPercent } from '../../utils/format';
import { getRiskBucket } from '../../utils/risk';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Slider } from '../ui/Slider';

const controls = [
  { key: 'percentAttended', label: 'Attendance %', min: 0, max: 100 },
  { key: 'logins', label: 'Logins', min: 0, max: 500 },
  { key: 'totalHoursInModuleArea', label: 'Total Hours', min: 0, max: 400 },
  { key: 'absence', label: 'Absence', min: 0, max: 100 },
] as const;

interface WhatIfPanelProps {
  studentId?: string;
  baselineFeatures: Record<string, unknown>;
}

export const WhatIfPanel = ({ studentId, baselineFeatures }: WhatIfPanelProps) => {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(
      controls.map((control) => {
        const parsed = Number(baselineFeatures[control.key] ?? 0);
        return [control.key, Number.isFinite(parsed) ? parsed : 0];
      }),
    ),
  );

  const safeBaseline = useMemo(() => {
    // Keep baseline always non-empty for backend validation and deterministic what-if behavior.
    const baseline: Record<string, number> = {};
    for (const control of controls) {
      const parsed = Number(baselineFeatures[control.key] ?? 0);
      baseline[control.key] = Number.isFinite(parsed) ? parsed : 0;
    }
    return baseline;
  }, [baselineFeatures]);

  useEffect(() => {
    setValues(
      Object.fromEntries(
        controls.map((control) => {
          const parsed = Number(baselineFeatures[control.key] ?? 0);
          return [control.key, Number.isFinite(parsed) ? parsed : 0];
        }),
      ),
    );
  }, [baselineFeatures]);

  const overrides = useMemo(() => {
    const patch: Record<string, number> = {};
    for (const control of controls) {
      if (values[control.key] !== safeBaseline[control.key]) {
        patch[control.key] = values[control.key];
      }
    }
    return patch;
  }, [safeBaseline, values]);

  const mutation = useMutation({
    mutationFn: runWhatIf,
    onSuccess: async (data) => {
      setResult(data);
      if (studentId) {
        await queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      }
    },
  });

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-slate-900">What-if Simulator</h3>
      <p className="mt-1 text-sm text-slate-500">Adjust key metrics and recalculate fail probability.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {controls.map((control) => (
          <div key={control.key} className="space-y-2 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">{control.label}</p>
              <span className="text-sm font-semibold text-slate-900">{values[control.key] ?? 0}</span>
            </div>
            <Slider
              min={control.min}
              max={control.max}
              value={values[control.key] ?? 0}
              onChange={(nextValue) => setValues((prev) => ({ ...prev, [control.key]: nextValue }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          onClick={() =>
            mutation.mutate({
              studentId,
              baselineFeatures: safeBaseline,
              overrides,
            })
          }
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Recalculating...' : 'Recalculate'}
        </Button>
        {mutation.isError && <p className="text-sm font-medium text-red-600">What-if request failed.</p>}
      </div>

      {result && (
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Baseline</p>
            <p className="text-xl font-bold text-slate-800">{formatPercent(result.baselineProbability)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">New</p>
            <p className="text-xl font-bold text-slate-800">{formatPercent(result.newProbability)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Delta</p>
            <p
              className={`text-xl font-bold ${
                result.delta >= 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {(result.delta * 100).toFixed(2)}%
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Bucket</p>
            <div className="mt-1">
              <Badge bucket={getRiskBucket(result.newProbability)} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
