import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentById } from '../api/students';
import { ExplanationChart } from '../components/ExplanationChart';
import { RiskChip } from '../components/RiskChip';
import { WhatIfPanel } from '../components/WhatIfPanel';
import { toPercent } from '../utils/format';

export function StudentPage() {
  const { id } = useParams<{ id: string }>();

  const studentQuery = useQuery({
    queryKey: ['student', id],
    queryFn: () => fetchStudentById(id ?? ''),
    enabled: Boolean(id),
  });

  if (studentQuery.isLoading) {
    return <p>Loading student...</p>;
  }

  if (!studentQuery.data) {
    return (
      <div>
        <p>Student not found.</p>
        <Link to="/dashboard">Back</Link>
      </div>
    );
  }

  const student = studentQuery.data;

  return (
    <section className="student-page">
      <Link to="/dashboard" className="back-link">
        Back to dashboard
      </Link>

      <div className="student-header">
        <h2>{student.fullName ?? student.externalStudentId ?? student.id}</h2>
        <RiskChip bucket={student.latestBucket} />
      </div>

      <div className="stats-grid">
        <article>
          <small>Latest Risk Probability</small>
          <strong>{toPercent(student.latestProbability)}</strong>
        </article>
        <article>
          <small>Department</small>
          <strong>{student.department ?? '-'}</strong>
        </article>
        <article>
          <small>Last Prediction</small>
          <strong>{student.lastPredictionAt ? new Date(student.lastPredictionAt).toLocaleString() : '-'}</strong>
        </article>
      </div>

      <ExplanationChart items={student.latestExplanations ?? []} />
      <WhatIfPanel studentId={student.id} baselineFeatures={student.features ?? {}} />
    </section>
  );
}
