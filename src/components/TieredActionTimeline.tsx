import React from 'react';
import { Check } from 'lucide-react';
import type { TieredAction, ActionStep } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getActionLabel } from '@/i18n';
import { cn } from '@/lib/cn';

interface TieredActionTimelineProps {
  tieredAction: TieredAction;
  listId: string;
  levelNum: number;
  checkedActions?: Record<string, boolean>;
  onToggleStep?: (stepIndex: number, step: ActionStep) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export const TieredActionTimeline: React.FC<TieredActionTimelineProps> = ({
  tieredAction,
  listId,
  levelNum,
  checkedActions: controlledCheckedActions,
  onToggleStep,
  disabled = false,
  className,
  compact = false,
}) => {
  const { language } = useTranslation();
  const storeCheckedActions = useAppStore(s => s.checkedActions);
  const setTieredActionStep = useAppStore(s => s.setTieredActionStep);

  const checkedActions = controlledCheckedActions ?? storeCheckedActions;
  const steps = tieredAction.steps || [];

  const stepKey = (step: ActionStep) => `${listId}|${levelNum}|${tieredAction.id}:${step.id}`;

  const completedCount = steps.reduce(
    (count, step) => (checkedActions[stepKey(step)] ? count + 1 : count),
    0,
  );

  const handleStepClick = (index: number) => {
    if (disabled) return;
    if (onToggleStep) {
      onToggleStep(index, steps[index]);
    } else {
      setTieredActionStep(listId, levelNum, tieredAction.id, steps, index);
    }
  };

  const actionTitle = getActionLabel(tieredAction, language);

  return (
    <div
      className={cn(
        'p-3.5 bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 space-y-3 transition-colors',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      {/* Header: Action Title & Counter */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
            {actionTitle}
          </h4>
        </div>
        <span
          className={cn(
            'text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 font-mono transition-colors',
            completedCount === steps.length && steps.length > 0
              ? 'bg-green-500 text-white'
              : completedCount > 0
              ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500',
          )}
        >
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Timeline Track */}
      {steps.length === 0 ? (
        <p className="text-[11px] text-gray-400 italic">Nessuna soglia definita.</p>
      ) : (
        <div className="overflow-x-auto py-2 scrollbar-thin">
          <div className="flex items-center min-w-full justify-between">
            {steps.map((step, idx) => {
              const isChecked = Boolean(checkedActions[stepKey(step)]);
              const isPrevChecked = idx > 0 && Boolean(checkedActions[stepKey(steps[idx - 1])]);
              const isNextChecked =
                idx < steps.length - 1 && Boolean(checkedActions[stepKey(steps[idx + 1])]);
              const stepLabel = getActionLabel(step, language);

              return (
                <div
                  key={step.id}
                  className="flex-1 flex flex-col items-center relative min-w-14 sm:min-w-16 group"
                >
                  {/* Label above node */}
                  <span
                    className={cn(
                      'text-[10px] sm:text-[11px] font-bold mb-2 transition-colors whitespace-nowrap select-none text-center truncate max-w-full px-1',
                      isChecked
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400',
                    )}
                    title={stepLabel}
                  >
                    {stepLabel}
                  </span>

                  {/* Circular Button + Centered Line Segments */}
                  <div className="relative flex items-center justify-center w-full">
                    {/* Left Line Segment */}
                    {idx > 0 && (
                      <div
                        className={cn(
                          'absolute right-1/2 left-0 top-1/2 -translate-y-1/2 h-0.5 transition-colors duration-200',
                          isPrevChecked && isChecked
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600',
                        )}
                      />
                    )}

                    {/* Right Line Segment */}
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-0.5 transition-colors duration-200',
                          isChecked && isNextChecked
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600',
                        )}
                      />
                    )}

                    {/* Circular Checkbox Button */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleStepClick(idx)}
                      className={cn(
                        'relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                        isChecked
                          ? 'bg-green-600 border-2 border-green-500 text-white shadow-xs shadow-green-500/30 active:scale-95'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-transparent hover:border-green-400 dark:hover:border-green-500 active:scale-95',
                      )}
                      aria-label={`${actionTitle} — ${stepLabel} (${isChecked ? 'Completato' : 'Incompleto'})`}
                    >
                      <Check
                        size={compact ? 13 : 15}
                        strokeWidth={3}
                        className={cn(
                          'transition-transform',
                          isChecked ? 'scale-100 text-white' : 'scale-0 text-transparent',
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
