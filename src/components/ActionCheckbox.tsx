import { Check } from 'lucide-react';
import { cn } from '../lib/cn';

/** Large, obvious checkbox + label row. Shared by the goal card, editor and detail page. */
export const ActionCheckbox = ({ label, checked, onToggle, disabled }: {
  label: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) => {
  const interactive = !!onToggle && !disabled;
  return (
    <button type="button" disabled={!interactive} onClick={onToggle}
      className={cn('w-full flex items-center gap-3 py-1 text-left transition-transform', interactive && 'active:scale-[0.98]')}>
      <span className={cn(
        'w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border-2 transition-colors duration-150',
        checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
      )}>
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </span>
      <span className={cn(
        'text-sm flex-1 transition-colors duration-150',
        checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200',
      )}>
        {label}
      </span>
    </button>
  );
};
