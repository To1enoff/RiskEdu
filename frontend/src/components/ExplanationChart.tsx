import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplanationItem } from '../types';

export function ExplanationChart({ items }: { items: ExplanationItem[] }) {
  if (!items.length) {
    return <p className="empty-state">No explanations yet.</p>;
  }

  return (
    <div className="chart-card">
      <h3>Top Risk Factors</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={items}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="displayName" angle={-15} textAnchor="end" height={90} interval={0} />
          <YAxis />
          <Tooltip formatter={(value: number) => value.toFixed(4)} />
          <Bar dataKey="contribution" fill="#d95f02" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
