import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StudentProfile } from '../../types';
import { Card } from '../ui/Card';

export const RiskTrendChart = ({ students }: { students: StudentProfile[] }) => {
  const high = students.filter((student) => (student.latestProbability ?? 0) >= 0.66).length;
  const medium = students.filter((student) => {
    const p = student.latestProbability ?? 0;
    return p >= 0.33 && p < 0.66;
  }).length;
  const low = students.filter((student) => (student.latestProbability ?? 0) < 0.33).length;

  const data = [
    { name: 'High', value: high, fill: '#ef4444' },
    { name: 'Medium', value: medium, fill: '#f59e0b' },
    { name: 'Low', value: low, fill: '#10b981' },
  ];

  return (
    <Card className="h-[320px] p-5">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Risk Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
