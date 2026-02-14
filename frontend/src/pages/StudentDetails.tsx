import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getStudentById } from '../api/students';
import { ExplainabilityChart } from '../components/student/ExplainabilityChart';
import { RiskSummary } from '../components/student/RiskSummary';
import { WhatIfPanel } from '../components/student/WhatIfPanel';
import { Skeleton } from '../components/ui/Skeleton';

export const StudentDetails = () => {
  const { id = '' } = useParams();

  const studentQuery = useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudentById(id),
    enabled: Boolean(id),
  });

  if (studentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-700">Failed to load student details.</p>
        <Link to="/dashboard" className="mt-2 inline-block text-sm font-semibold text-blue-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const student = studentQuery.data;

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="text-sm font-semibold text-blue-600">
        Back to dashboard
      </Link>
      <RiskSummary student={student} />
      <ExplainabilityChart data={student.latestExplanations ?? []} />
      <WhatIfPanel studentId={student.id} baselineFeatures={student.features ?? {}} />
    </div>
  );
};
