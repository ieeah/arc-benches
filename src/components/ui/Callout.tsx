import React from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getCalloutClasses, type CalloutVariant } from '@/lib/uiVariants';

export type CalloutProps = {
  variant?: CalloutVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

const DEFAULT_ICONS: Record<CalloutVariant, React.ComponentType<{ size?: number; className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
};

export function Callout({
  variant = 'info',
  title,
  children,
  icon,
  action,
  className,
}: CalloutProps) {
  const { container, title: titleCls, icon: iconCls } = getCalloutClasses({ variant });
  const IconComponent = DEFAULT_ICONS[variant];

  return (
    <div className={cn(container, className)} role="status">
      <div className={iconCls}>
        {icon ?? <IconComponent size={18} />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        {title && <div className={titleCls}>{title}</div>}
        <div className="text-current opacity-90">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
