import React from 'react';
import { cn } from '@/lib/cn';
import { getSwitchClasses, type SwitchSize } from '@/lib/uiVariants';

export type SwitchProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  label?: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  ariaLabel?: string;
  className?: string;
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  id,
  ariaLabel,
  className,
}: SwitchProps) {
  const { track, thumb } = getSwitchClasses({ checked, size });

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange?.(!checked);
    }
  };

  const switchButton = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(track, disabled && 'cursor-not-allowed opacity-50')}
    >
      <span className={thumb} />
    </button>
  );

  if (!label && !description) {
    return className ? <div className={className}>{switchButton}</div> : switchButton;
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start justify-between gap-3',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className
      )}
    >
      <div className="space-y-0.5 select-none">
        {label && (
          <span className="block text-xs font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </span>
        )}
        {description && (
          <span className="block text-[11px] text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
      {switchButton}
    </div>
  );
}
