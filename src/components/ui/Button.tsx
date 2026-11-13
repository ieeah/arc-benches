import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  getButtonClasses,
  type ButtonVariant,
  type ButtonSize,
} from '@/lib/uiVariants';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const spinnerSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;

  return (
    <button
      disabled={disabled || isLoading}
      className={getButtonClasses({
        variant,
        size,
        disabled: disabled || isLoading,
        fullWidth,
        className,
      })}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={spinnerSize} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
