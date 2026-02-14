import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplanationItem } from '../../types';
import { Card } from '../ui/Card';

export const ExplainabilityChart = ({ data }: { data: ExplanationItem[] }) => {
  if (!data.length) {
    return <Card className="p-5 text-slate-500">No explanations yet.</Card>;
  }

  return (
    <Card className="h-[360px] p-5">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Top Explainability Factors</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 5)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="displayName" angle={-15} textAnchor="end" interval={0} height={90} />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Bar dataKey="contribution" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
