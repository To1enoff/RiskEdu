import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { runWhatIf } from '../api/students';
import { WhatIfResponse } from '../types';
import { toPercent } from '../utils/format';
import { RiskChip } from './RiskChip';

interface WhatIfPanelProps {
  studentId?: string;
  baselineFeatures: Record<string, unknown>;
}

const editableFields = [
  { key: 'percentAttended', label: 'Attendance %', min: 0, max: 100, step: 1 },
  { key: 'logins', label: 'Logins', min: 0, max: 500, step: 1 },
  { key: 'totalHoursInModuleArea', label: 'Total Hours', min: 0, max: 400, step: 1 },
  { key: 'absence', label: 'Absence', min: 0, max: 100, step: 1 },
] as const;

export function WhatIfPanel({ studentId, baselineFeatures }: WhatIfPanelProps) {
  const [formState, setFormState] = useState<Record<string, number>>({});
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  useEffect(() => {
    const nextState: Record<string, number> = {};
    editableFields.forEach((field) => {
      const value = Number(baselineFeatures[field.key] ?? 0);
      nextState[field.key] = Number.isFinite(value) ? value : 0;
    });
    setFormState(nextState);
    setResult(null);
  }, [baselineFeatures]);

  const mutation = useMutation({
    mutationFn: runWhatIf,
    onSuccess: (data) => setResult(data),
  });

  const simulationBaseline = useMemo(() => {
    if (Object.keys(baselineFeatures).length > 0) {
      return baselineFeatures;
    }

    const fallback: Record<string, number> = {};
    editableFields.forEach((field) => {
      fallback[field.key] = 0;
    });
    return fallback;
  }, [baselineFeatures]);

  const overrides = useMemo(() => {
    const patch: Record<string, number> = {};
    editableFields.forEach((field) => {
      const baseline = Number(simulationBaseline[field.key] ?? 0);
      const next = Number(formState[field.key]);
      if (Number.isFinite(next) && next !== baseline) {
        patch[field.key] = next;
      }
    });
    return patch;
  }, [formState, simulationBaseline]);

  const submit = () => {
    mutation.mutate({
      studentId,
      baselineFeatures: simulationBaseline,
      overrides,
    });
  };

  return (
    <section className="whatif-card">
      <h3>What-if Simulator</h3>
      <p>Adjust selected features and recalculate failure probability.</p>
      <div className="whatif-grid">
        {editableFields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={formState[field.key] ?? 0}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  [field.key]: Number(event.target.value),
                }))
              }
            />
            <strong>{formState[field.key] ?? 0}</strong>
          </label>
        ))}
      </div>
      <button onClick={submit} disabled={mutation.isPending}>
        {mutation.isPending ? 'Simulating...' : 'Run What-if'}
      </button>
      {mutation.isError && (
        <p className="form-error">
          Could not run what-if simulation. Try changing a slider and run again.
        </p>
      )}

      {result && (
        <div className="whatif-result">
          <div>
            <small>Baseline</small>
            <strong>{toPercent(result.baselineProbability)}</strong>
          </div>
          <div>
            <small>New</small>
            <strong>{toPercent(result.newProbability)}</strong>
          </div>
          <div>
            <small>Delta</small>
            <strong className={result.delta >= 0 ? 'negative-delta' : 'positive-delta'}>
              {(result.delta * 100).toFixed(2)}%
            </strong>
          </div>
          <div>
            <small>Bucket</small>
            <RiskChip bucket={result.bucket} />
          </div>
        </div>
      )}
    </section>
  );
}
