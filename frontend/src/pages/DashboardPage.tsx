import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchFeatureImportance } from '../api/analytics';
import { fetchStudents } from '../api/students';
import { StudentTable } from '../components/StudentTable';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();
  const [riskBucket, setRiskBucket] = useState<'green' | 'yellow' | 'red' | undefined>(undefined);
  const [page, setPage] = useState(1);

  const studentsQuery = useQuery({
    queryKey: ['students', page, riskBucket],
    queryFn: () =>
      fetchStudents({
        page,
        limit: 20,
        riskBucket,
        sort: 'desc',
      }),
  });

  const importanceQuery = useQuery({
    queryKey: ['feature-importance'],
    queryFn: () => fetchFeatureImportance(),
    enabled: user?.role === 'admin',
  });

  const highlightedIds = useMemo(() => {
    const items = studentsQuery.data?.items ?? [];
    const sorted = [...items].sort((a, b) => (b.latestProbability ?? 0) - (a.latestProbability ?? 0));
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    return new Set(sorted.slice(0, topCount).map((student) => student.id));
  }, [studentsQuery.data?.items]);

  return (
    <section className="dashboard">
      <div className="dashboard-actions">
        <h2>Advisor Dashboard</h2>
        <div className="filters">
          <button onClick={() => setRiskBucket(undefined)} className={!riskBucket ? 'active' : ''}>
            All
          </button>
          <button onClick={() => setRiskBucket('red')} className={riskBucket === 'red' ? 'active' : ''}>
            Red
          </button>
          <button
            onClick={() => setRiskBucket('yellow')}
            className={riskBucket === 'yellow' ? 'active' : ''}
          >
            Yellow
          </button>
          <button
            onClick={() => setRiskBucket('green')}
            className={riskBucket === 'green' ? 'active' : ''}
          >
            Green
          </button>
        </div>
      </div>

      {studentsQuery.isLoading ? (
        <p>Loading students...</p>
      ) : (
        <>
          <p className="hint">
            Priority mode: rows highlighted in orange are top 10% highest risk in current page.
          </p>
          <StudentTable items={studentsQuery.data?.items ?? []} highlightIds={highlightedIds} />
          <div className="pager">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
              Prev
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((value) => value + 1)}
              disabled={page >= (studentsQuery.data?.totalPages ?? 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {user?.role === 'admin' && (
        <section className="chart-card">
          <h3>Department Feature Importance</h3>
          {importanceQuery.isLoading ? (
            <p>Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={importanceQuery.data?.features ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayName" angle={-15} textAnchor="end" height={90} interval={0} />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toFixed(4)} />
                <Bar dataKey="score" fill="#1f78b4" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      )}
    </section>
  );
}
