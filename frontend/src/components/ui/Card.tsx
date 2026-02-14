import { ReactNode } from 'react';

type CardVariant = 'glass' | 'solid';

export const Card = ({
  children,
  variant = 'solid',
  className = '',
}: {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}) => {
  const styles =
    variant === 'glass'
      ? 'glass-card rounded-3xl'
      : 'rounded-3xl border border-slate-200 bg-white shadow-soft';

  return <div className={`${styles} ${className}`}>{children}</div>;
};
