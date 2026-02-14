import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'solid' | 'outline' | 'glass';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const byVariant: Record<ButtonVariant, string> = {
  solid:
    'btn-accent text-white shadow-soft hover:scale-[1.02] hover:shadow-lg border border-transparent',
  outline:
    'bg-white text-slate-700 border border-slate-200 hover:scale-[1.02] hover:shadow-soft hover:border-slate-300',
  glass:
    'glass-card text-slate-800 hover:scale-[1.02] hover:shadow-soft border border-white/50',
};

export const Button = ({ variant = 'solid', className = '', ...props }: ButtonProps) => (
  <button
    className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${byVariant[variant]} ${className}`}
    {...props}
  />
);
