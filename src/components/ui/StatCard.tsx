import React from 'react';
import { cn } from '@/lib/cn';
import { getStatCardClasses, type StatCardColor } from '@/lib/uiVariants';

export type StatCardProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  color?: StatCardColor;
  className?: string;
  onClick?: () => void;
};

export function StatCard({
  label,
  value,
  subtext,
  icon,
  color = 'gray',
  className,
  onClick,
}: StatCardProps) {
  const { container, value: valueCls, label: labelCls } = getStatCardClasses({ color });

  return (
    <div
      onClick={onClick}
      className={cn(
        container,
        onClick && 'cursor-pointer hover:opacity-90 active:scale-98',
        className
      )}
    >
      {icon && <div className="flex justify-center mb-1 text-current opacity-80">{icon}</div>}
      <span className={valueCls}>{value}</span>
      <span className={labelCls}>{label}</span>
      {subtext && (
        <span className="block mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
          {subtext}
        </span>
      )}
    </div>
  );
}
