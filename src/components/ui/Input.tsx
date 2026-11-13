import React from 'react';
import { cn } from '@/lib/cn';
import { getInputClasses, type InputSize } from '@/lib/uiVariants';

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  hasError?: boolean;
  containerClassName?: string;
};

export function Input({
  inputSize = 'md',
  leftIcon,
  rightElement,
  hasError = false,
  containerClassName,
  className,
  id,
  disabled,
  ...props
}: InputProps) {
  const hasLeft = Boolean(leftIcon);
  const hasRight = Boolean(rightElement);

  const inputClasses = getInputClasses({
    inputSize,
    hasLeftIcon: hasLeft,
    hasRightElement: hasRight,
    hasError,
    className,
  });

  if (!hasLeft && !hasRight) {
    return (
      <input
        id={id}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
    );
  }

  return (
    <div className={cn('relative w-full', containerClassName)}>
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center shrink-0">
          {leftIcon}
        </div>
      )}
      <input
        id={id}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {rightElement}
        </div>
      )}
    </div>
  );
}
