import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type FilterBucket = 'all' | 'green' | 'yellow' | 'red';

interface FiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  bucket: FilterBucket;
  onBucketChange: (bucket: FilterBucket) => void;
}

const buckets: FilterBucket[] = ['all', 'red', 'yellow', 'green'];

export const FiltersBar = ({ search, onSearchChange, bucket, onBucketChange }: FiltersBarProps) => (
  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
    <Input
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Search by name, email or ID"
      className="md:max-w-sm"
    />
    <div className="flex flex-wrap gap-2">
      {buckets.map((option) => (
        <Button
          key={option}
          variant={bucket === option ? 'solid' : 'outline'}
          className="px-4 py-2 capitalize"
          onClick={() => onBucketChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);
