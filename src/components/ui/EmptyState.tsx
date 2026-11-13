import React from 'react';
import { cn } from '@/lib/cn';

export type EmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30',
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8',
        className
      )}
    >
      {icon && (
        <div className="mb-3 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
