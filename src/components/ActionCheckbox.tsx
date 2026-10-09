import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ActionContext, Reward } from '@/types';
import { ActionContextChips } from '@/components/ActionContextChips';
import { RewardBadge } from '@/components/RewardBadge';

/** Large, obvious checkbox + label row. Shared by the goal card, editor and detail page. */
export const ActionCheckbox = ({
  label,
  checked,
  onToggle,
  disabled,
  rewards,
  maps,
  carryItems,
}: ActionContext & {
  label: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  rewards?: Reward[];
}) => {
  const interactive = !!onToggle && !disabled;
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 py-1 text-left transition-transform',
        interactive && 'active:scale-[0.98]',
      )}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border-2 transition-colors duration-150',
          checked
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
        )}
      >
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'text-sm transition-colors duration-150',
            checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200',
          )}
        >
          {label}
        </span>
        {rewards && rewards.length > 0 && (
          <span className="flex items-center gap-1 flex-wrap">
            {rewards.map((r, i) => (
              <RewardBadge key={i} reward={r} size="xs" obtained={checked} />
            ))}
          </span>
        )}
        <ActionContextChips maps={maps} carryItems={carryItems} className={cn(checked && 'opacity-50')} />
      </div>
    </button>
  );
};
