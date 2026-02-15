import { CSSProperties, ReactNode } from 'react';

type CardVariant = 'glass' | 'solid';

export const Card = ({
  children,
  variant = 'solid',
  className = '',
  style,
}: {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: CSSProperties;
}) => {
  const styles =
    variant === 'glass'
      ? 'glass-card rounded-3xl'
      : 'rounded-3xl border border-slate-200 bg-white shadow-soft';

  return (
    <div className={`${styles} ${className}`} style={style}>
      {children}
    </div>
  );
};
