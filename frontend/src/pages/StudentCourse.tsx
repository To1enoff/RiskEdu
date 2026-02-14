import { ChangeEvent, Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  getCourseRisk,
  getCourseSuggestions,
  getCourseWeights,
  getExams,
  getStudentCourseById,
  getWeeks,
  predictCourseRisk,
  runCourseWhatIf,
  saveManualSyllabus,
  submitExam,
  submitWeek,
  uploadSyllabusFile,
} from '../api/courses';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { Slider } from '../components/ui/Slider';
import { CourseWeightInput } from '../types';
import { formatPercent } from '../utils/format';

type TabKey = 'overview' | 'weeks' | 'exams' | 'risk' | 'whatif' | 'suggestions';

const defaultWeights: CourseWeightInput = {
  midterm: 30,
  final: 40,
  quizzes: 20,
  assignments: 10,
  projects: 0,
};

export const StudentCourse = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('overview');
  const [title, setTitle] = useState('');
  const [weights, setWeights] = useState<CourseWeightInput>(defaultWeights);
  const [file, setFile] = useState<File | null>(null);
  const [whatIf, setWhatIf] = useState({
    quizzesAverage: 60,
    assignmentsAverage: 60,
    midtermScore: 60,
    finalScore: 60,
    totalAbsences: 0,
  });

  const courseQuery = useQuery({ queryKey: ['student-course', id], queryFn: () => getStudentCourseById(id), enabled: Boolean(id) });
  const weightsQuery = useQuery({ queryKey: ['course-weights', id], queryFn: () => getCourseWeights(id), enabled: Boolean(id) });
  const weeksQuery = useQuery({ queryKey: ['course-weeks', id], queryFn: () => getWeeks(id), enabled: Boolean(id) });
  const examsQuery = useQuery({ queryKey: ['course-exams', id], queryFn: () => getExams(id), enabled: Boolean(id) });
  const riskQuery = useQuery({ queryKey: ['course-risk', id], queryFn: () => getCourseRisk(id), enabled: Boolean(id) });
  const suggestionsQuery = useQuery({ queryKey: ['course-suggestions', id], queryFn: () => getCourseSuggestions(id), enabled: Boolean(id) });

  useEffect(() => {
    if (!weightsQuery.data) return;
    setTitle(weightsQuery.data.title);
    const mapped = { ...defaultWeights };
    for (const row of weightsQuery.data.weights) {
      if (row.componentName in mapped) {
        mapped[row.componentName as keyof CourseWeightInput] = row.weightPercent;
      }
    }
    setWeights(mapped);
  }, [weightsQuery.data]);

  useEffect(() => {
    if (!riskQuery.data) return;
    setWhatIf((prev) => ({ ...prev, totalAbsences: riskQuery.data.totalAbsences }));
  }, [riskQuery.data]);

  const totalWeight = useMemo(
    () => weights.midterm + weights.final + weights.quizzes + weights.assignments + (weights.projects ?? 0),
    [weights],
  );
  const weightValid = Math.abs(totalWeight - 100) < 0.0001;

  const saveSyllabusMutation = useMutation({
    mutationFn: () => saveManualSyllabus(id, { title, weights }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-weights', id] });
    },
  });

  const uploadSyllabusMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;
      return uploadSyllabusFile(id, file);
    },
    onSuccess: async () => {
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ['course-weights', id] });
    },
  });

  const saveWeekMutation = useMutation({
    mutationFn: ({
      weekNumber,
      quizScore,
      assignmentScore,
      absenceCountWeek,
    }: {
      weekNumber: number;
      quizScore: number | null;
      assignmentScore: number | null;
      absenceCountWeek: number;
    }) =>
      submitWeek(id, weekNumber, {
        quizScore: quizScore ?? undefined,
        assignmentScore: assignmentScore ?? undefined,
        absenceCountWeek,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-weeks', id] });
      await queryClient.invalidateQueries({ queryKey: ['student-course', id] });
    },
  });

  const saveExamsMutation = useMutation({
    mutationFn: async (payload: { midterm?: number; final?: number }) => {
      if (payload.midterm !== undefined) {
        await submitExam(id, { type: 'midterm', score: payload.midterm });
      }
      if (payload.final !== undefined) {
        await submitExam(id, { type: 'final', score: payload.final });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-exams', id] });
    },
  });

  const predictMutation = useMutation({
    mutationFn: () => predictCourseRisk(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-risk', id] });
      await queryClient.invalidateQueries({ queryKey: ['course-suggestions', id] });
      await queryClient.invalidateQueries({ queryKey: ['student-course', id] });
    },
  });

  const whatIfMutation = useMutation({
    mutationFn: () => runCourseWhatIf(id, { overrides: whatIf }),
  });

  if (courseQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }
  if (courseQuery.isError || !courseQuery.data) {
    return <p className="text-sm font-medium text-red-600">Failed to load course.</p>;
  }

  const weeks = weeksQuery.data ?? [];
  const exams = examsQuery.data?.exams ?? [];
  const midterm = exams.find((e) => e.type === 'midterm')?.score;
  const final = exams.find((e) => e.type === 'final')?.score;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{courseQuery.data.title}</h1>
          <p className="mt-1 text-sm text-slate-500">Course-scoped prediction and simulation.</p>
        </div>
        <Link to="/student/dashboard" className="text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['overview', 'weeks', 'exams', 'risk', 'whatif', 'suggestions'] as TabKey[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              tab === item ? 'btn-accent text-white' : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {item === 'whatif' ? 'What-If' : item === 'suggestions' ? 'AI Suggestions' : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <Card className="p-6">
            <p className="text-sm text-slate-500">Course title</p>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <WeightInput label="Midterm %" value={weights.midterm} onChange={onWeight('midterm', setWeights)} />
              <WeightInput label="Final %" value={weights.final} onChange={onWeight('final', setWeights)} />
              <WeightInput label="Quizzes %" value={weights.quizzes} onChange={onWeight('quizzes', setWeights)} />
              <WeightInput label="Assignments %" value={weights.assignments} onChange={onWeight('assignments', setWeights)} />
              <WeightInput label="Projects %" value={weights.projects ?? 0} onChange={onWeight('projects', setWeights)} />
            </div>
            <p className={`mt-3 text-sm font-semibold ${weightValid ? 'text-emerald-700' : 'text-red-700'}`}>
              Total weight: {totalWeight.toFixed(1)}% {weightValid ? '' : '(must equal 100)'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => saveSyllabusMutation.mutate()} disabled={!weightValid || saveSyllabusMutation.isPending}>
                Save Syllabus
              </Button>
              <Input type="file" accept=".pdf,.docx,.txt" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="max-w-xs" />
              <Button variant="outline" onClick={() => uploadSyllabusMutation.mutate()} disabled={!file || uploadSyllabusMutation.isPending}>
                Upload
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'weeks' && (
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {weeks.map((week) => (
              <div key={week.weekNumber} className="rounded-2xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Week {week.weekNumber}</h3>
                <div className="mt-2 grid gap-2">
                  <Input id={`quiz-${week.weekNumber}`} type="number" defaultValue={week.quizScore ?? ''} placeholder="Quiz score" />
                  <Input id={`assign-${week.weekNumber}`} type="number" defaultValue={week.assignmentScore ?? ''} placeholder="Assignment score" />
                  <Input id={`absence-${week.weekNumber}`} type="number" defaultValue={week.absenceCountWeek} placeholder="Absence count" />
                </div>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={() =>
                    saveWeekMutation.mutate({
                      weekNumber: week.weekNumber,
                      quizScore: parseOptionalNumber((document.getElementById(`quiz-${week.weekNumber}`) as HTMLInputElement)?.value),
                      assignmentScore: parseOptionalNumber((document.getElementById(`assign-${week.weekNumber}`) as HTMLInputElement)?.value),
                      absenceCountWeek: Number((document.getElementById(`absence-${week.weekNumber}`) as HTMLInputElement)?.value || 0),
                    })
                  }
                >
                  Save Week
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'exams' && (
        <Card className="p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <Input id="course-midterm" type="number" defaultValue={midterm ?? ''} placeholder="Midterm score" />
            <Input id="course-final" type="number" defaultValue={final ?? ''} placeholder="Final score" />
          </div>
          <Button
            className="mt-3"
            onClick={() =>
              saveExamsMutation.mutate({
                midterm: parseOptionalNumber((document.getElementById('course-midterm') as HTMLInputElement)?.value) ?? undefined,
                final: parseOptionalNumber((document.getElementById('course-final') as HTMLInputElement)?.value) ?? undefined,
              })
            }
          >
            Save Exams
          </Button>
        </Card>
      )}

      {tab === 'risk' && (
        <Card className="p-6">
          {riskQuery.isLoading && <Skeleton className="h-32" />}
          {riskQuery.data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-slate-900">{riskQuery.data.weightedPercent.toFixed(1)}%</p>
                <Badge bucket={riskQuery.data.bucket} />
              </div>
              <p className="text-sm text-slate-600">Risk probability: {formatPercent(riskQuery.data.probabilityFail)}</p>
              <p className={`text-sm font-semibold ${riskQuery.data.canStillPass ? 'text-emerald-700' : 'text-red-700'}`}>
                {riskQuery.data.canStillPass ? 'Can still pass' : 'Cannot reach passing threshold'}
              </p>
              {riskQuery.data.totalAbsences > 30 && <p className="text-sm font-semibold text-red-700">Absences exceed 30: auto-fail</p>}
              {riskQuery.data.maxAchievablePercent < 50 && <p className="text-sm font-semibold text-red-700">Max achievable is below 50</p>}
              <Button onClick={() => predictMutation.mutate()} disabled={predictMutation.isPending}>
                {predictMutation.isPending ? 'Predicting...' : 'Recalculate Risk'}
              </Button>
              <ul className="list-disc space-y-1 pl-6 text-sm text-slate-700">
                {riskQuery.data.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {tab === 'whatif' && (
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <SliderField label="Quizzes Avg" value={whatIf.quizzesAverage} min={0} max={100} onChange={(value) => setWhatIf((p) => ({ ...p, quizzesAverage: value }))} />
            <SliderField label="Assignments Avg" value={whatIf.assignmentsAverage} min={0} max={100} onChange={(value) => setWhatIf((p) => ({ ...p, assignmentsAverage: value }))} />
            <SliderField label="Midterm" value={whatIf.midtermScore} min={0} max={100} onChange={(value) => setWhatIf((p) => ({ ...p, midtermScore: value }))} />
            <SliderField label="Final" value={whatIf.finalScore} min={0} max={100} onChange={(value) => setWhatIf((p) => ({ ...p, finalScore: value }))} />
            <SliderField label="Total Absences" value={whatIf.totalAbsences} min={0} max={45} onChange={(value) => setWhatIf((p) => ({ ...p, totalAbsences: value }))} />
          </div>
          <Button className="mt-4" onClick={() => whatIfMutation.mutate()} disabled={whatIfMutation.isPending}>
            {whatIfMutation.isPending ? 'Simulating...' : 'Run What-If'}
          </Button>
          {whatIfMutation.data && (
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <Metric title="Baseline" value={formatPercent(whatIfMutation.data.baselineProbability)} />
              <Metric title="New" value={formatPercent(whatIfMutation.data.newProbability)} />
              <Metric title="Delta" value={formatPercent(whatIfMutation.data.delta)} />
              <Metric title="Bucket" value={whatIfMutation.data.bucket} />
            </div>
          )}
        </Card>
      )}

      {tab === 'suggestions' && (
        <Card className="p-6">
          <div className="space-y-3">
            {(suggestionsQuery.data?.suggestions ?? []).map((suggestion) => (
              <div key={suggestion.title} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{suggestion.title}</p>
                <p className="mt-1 text-sm text-slate-600">{suggestion.why}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {suggestion.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
            {(suggestionsQuery.data?.suggestions ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Run course prediction first to generate suggestions.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const WeightInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label className="space-y-1">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <Input type="number" min={0} max={100} value={value} onChange={onChange} />
  </label>
);

const SliderField = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div>
    <p className="text-sm font-medium text-slate-700">{label}</p>
    <Slider min={min} max={max} value={value} onChange={onChange} />
    <p className="text-sm text-slate-500">{value}</p>
  </div>
);

const Metric = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">{title}</p>
    <p className="text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

const parseOptionalNumber = (raw: string | undefined | null): number | null => {
  if (!raw || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const onWeight =
  (key: keyof CourseWeightInput, setWeights: Dispatch<SetStateAction<CourseWeightInput>>) =>
  (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value || 0);
    setWeights((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
  };
