import { Link } from 'react-router-dom';
import { StudentProfile } from '../types';
import { toPercent } from '../utils/format';
import { RiskChip } from './RiskChip';

interface StudentTableProps {
  items: StudentProfile[];
  highlightIds: Set<string>;
}

export function StudentTable({ items, highlightIds }: StudentTableProps) {
  if (!items.length) {
    return <p className="empty-state">No students found. Run predictions first to populate profiles.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="students-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Department</th>
            <th>Risk</th>
            <th>Bucket</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((student) => (
            <tr key={student.id} className={highlightIds.has(student.id) ? 'priority-row' : ''}>
              <td>{student.fullName ?? student.externalStudentId ?? student.id.slice(0, 8)}</td>
              <td>{student.department ?? '-'}</td>
              <td>{toPercent(student.latestProbability)}</td>
              <td>
                <RiskChip bucket={student.latestBucket} />
              </td>
              <td>
                <Link to={`/students/${student.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
