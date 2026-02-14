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
import { getFeatureImportance } from '../api/analytics';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';

export const Analytics = () => {
  const { user } = useAuth();
  const analyticsQuery = useQuery({
    queryKey: ['analytics', 'feature-importance'],
    queryFn: () => getFeatureImportance(),
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <Card className="p-6 text-slate-600">
        Analytics is available for admin users only.
      </Card>
    );
  }

  if (analyticsQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }

  if (analyticsQuery.isError) {
    return <p className="text-sm font-medium text-red-600">Failed to load analytics.</p>;
  }

  return (
    <Card className="h-[420px] p-6">
      <h1 className="text-2xl font-bold text-slate-900">Global Feature Importance</h1>
      <p className="mb-4 mt-1 text-sm text-slate-500">Department-level impact summary for fail risk.</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={analyticsQuery.data?.features ?? []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="displayName" angle={-15} textAnchor="end" interval={0} height={100} />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Bar dataKey="score" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
