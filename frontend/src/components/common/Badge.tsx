import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  dot = false,
  title,
}) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      text: 'text-emerald-800',
      dotColor: 'bg-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      text: 'text-amber-800',
      dotColor: 'bg-amber-500',
    },
    error: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      text: 'text-rose-800',
      dotColor: 'bg-rose-500',
    },
    info: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      text: 'text-blue-800',
      dotColor: 'bg-blue-500',
    },
    accent: {
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      text: 'text-indigo-800',
      dotColor: 'bg-indigo-600',
    },
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      text: 'text-slate-700',
      dotColor: 'bg-slate-400',
    },
  };

  const current = styles[variant];

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${current.bg} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />}
      {children}
    </span>
  );
};
