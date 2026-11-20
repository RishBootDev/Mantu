import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white border border-mantu-border rounded shadow-card ${className}`}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-mantu-border flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-mantu-text">{title}</h3>}
            {subtitle && <p className="text-xs text-mantu-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};
