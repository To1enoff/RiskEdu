export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />
);
