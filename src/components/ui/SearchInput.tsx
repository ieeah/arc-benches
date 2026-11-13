import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from './Input';

export type SearchInputProps = Omit<InputProps, 'leftIcon' | 'rightElement'> & {
  onClear?: () => void;
  clearAriaLabel?: string;
};

export function SearchInput({
  value,
  onClear,
  clearAriaLabel = 'Cancella testo di ricerca',
  onChange,
  inputSize = 'md',
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
      type="search"
      value={value}
      onChange={onChange}
      inputSize={inputSize}
      leftIcon={<Search size={iconSize} className="pointer-events-none" />}
      rightElement={clearButton}
      {...props}
    />
  );
}
