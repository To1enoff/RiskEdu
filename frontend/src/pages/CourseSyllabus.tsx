import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getCourseWeights, saveManualSyllabus, uploadSyllabusFile } from '../api/courses';
import { CourseNav } from '../components/student/CourseNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { CourseWeightInput } from '../types';

const defaultWeights: CourseWeightInput = {
  midterm: 30,
  final: 40,
  quizzes: 20,
  assignments: 10,
  projects: 0,
};

export const CourseSyllabus = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [weights, setWeights] = useState<CourseWeightInput>(defaultWeights);
  const [file, setFile] = useState<File | null>(null);

  const weightsQuery = useQuery({
    queryKey: ['course-weights', id],
    queryFn: () => getCourseWeights(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!weightsQuery.data) {
      return;
    }
    setTitle(weightsQuery.data.title);
    const mapped = { ...defaultWeights };
    for (const item of weightsQuery.data.weights) {
      if (item.componentName in mapped) {
        mapped[item.componentName as keyof CourseWeightInput] = item.weightPercent;
      }
    }
    setWeights(mapped);
  }, [weightsQuery.data]);

  const totalWeight = useMemo(
    () =>
      Number(weights.midterm) +
      Number(weights.final) +
      Number(weights.quizzes) +
      Number(weights.assignments) +
      Number(weights.projects ?? 0),
    [weights],
  );
  const isValid = Math.abs(totalWeight - 100) < 0.0001;

  const saveMutation = useMutation({
    mutationFn: () => saveManualSyllabus(id, { title, weights }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course-weights', id] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return null;
      return uploadSyllabusFile(id, file);
    },
    onSuccess: async () => {
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ['course-weights', id] });
    },
  });

  const onWeightChange =
    (key: keyof CourseWeightInput) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value ?? 0);
      setWeights((prev) => ({
        ...prev,
        [key]: Number.isFinite(value) ? value : 0,
      }));
    };

  if (weightsQuery.isLoading) {
    return <Skeleton className="h-80" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Course Syllabus</h1>
        <Link to="/dashboard" className="text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>

      <CourseNav courseId={id} />

      <Card className="space-y-5 p-6">
        <div>
          <p className="text-sm text-slate-500">Course title</p>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <WeightInput label="Midterm %" value={weights.midterm} onChange={onWeightChange('midterm')} />
          <WeightInput label="Final %" value={weights.final} onChange={onWeightChange('final')} />
          <WeightInput label="Quizzes %" value={weights.quizzes} onChange={onWeightChange('quizzes')} />
          <WeightInput
            label="Assignments %"
            value={weights.assignments}
            onChange={onWeightChange('assignments')}
          />
          <WeightInput label="Projects %" value={weights.projects ?? 0} onChange={onWeightChange('projects')} />
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          Total weight: {totalWeight.toFixed(2)}% {isValid ? '' : '(must equal 100%)'}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={!isValid || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Saving...' : 'Save syllabus'}
          </Button>
          {saveMutation.isError && <p className="text-sm text-red-600">Failed to save syllabus.</p>}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Upload syllabus file (PDF/DOCX/TXT)</h2>
        <Input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <Button variant="outline" disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>
          {uploadMutation.isPending ? 'Uploading...' : 'Upload and parse'}
        </Button>
        {uploadMutation.isError && <p className="text-sm text-red-600">Failed to parse uploaded syllabus.</p>}
      </Card>
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
