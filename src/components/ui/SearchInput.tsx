import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { cn } from '@/lib/cn';

export type SearchInputProps = Omit<InputProps, 'leftIcon' | 'rightElement'> & {
  onClear?: () => void;
  clearAriaLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  variant?: 'default' | 'pill';
};

export function SearchInput({
  value,
  onClear,
  clearAriaLabel = 'Cancella testo di ricerca',
  onChange,
  inputSize = 'md',
  inputRef,
  variant = 'default',
  className,
  ...props
}: SearchInputProps) {
  const iconSize = inputSize === 'sm' ? 14 : 16;
  const hasValue = typeof value === 'string' ? value.length > 0 : Boolean(value);

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    inputRef?.current?.focus();
  };

  const clearButton = hasValue ? (
    <button
      type="button"
      onClick={handleClear}
      aria-label={clearAriaLabel}
      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors cursor-pointer"
    >
      <X size={iconSize - 2} />
    </button>
  ) : undefined;

  return (
    <Input
      ref={inputRef}
      type="search"
      value={value}
      onChange={onChange}
      inputSize={inputSize}
      leftIcon={<Search size={iconSize} className="pointer-events-none" />}
      rightElement={clearButton}
      className={cn(
        variant === 'pill' &&
          'rounded-full text-xs font-semibold border-0 bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50',
        className
      )}
      {...props}
    />
  );
}
