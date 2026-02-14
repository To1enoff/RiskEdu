import { InputHTMLAttributes } from 'react';

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${className}`}
    {...props}
  />
);
