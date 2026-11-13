import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonClassOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const BUTTON_BASE =
  'inline-flex items-center justify-center font-bold rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:ring-2 focus-visible:outline-hidden';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
  outline: 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-xs',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3.5 py-1.5 text-xs gap-2',
  lg: 'px-4 py-2.5 text-sm gap-2.5',
};

export function getButtonClasses({
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className,
}: ButtonClassOptions): string {
  return cn(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    fullWidth && 'w-full',
    disabled && 'disabled:opacity-40 disabled:cursor-not-allowed',
    className
  );
}

export type InputSize = 'sm' | 'md';

export type InputClassOptions = {
  inputSize?: InputSize;
  hasLeftIcon?: boolean;
  hasRightElement?: boolean;
  hasError?: boolean;
  className?: string;
};

const INPUT_BASE =
  'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors';

const INPUT_SIZES: Record<InputSize, string> = {
  sm: 'py-1.5 text-xs px-3',
  md: 'py-2 text-sm px-3',
};

export function getInputClasses({
  inputSize = 'md',
  hasLeftIcon = false,
  hasRightElement = false,
  hasError = false,
  className,
}: InputClassOptions): string {
  return cn(
    INPUT_BASE,
    INPUT_SIZES[inputSize],
    hasLeftIcon && 'pl-9',
    hasRightElement && 'pr-8',
    hasError && 'border-red-500 dark:border-red-500 focus:ring-red-500',
    className
  );
}

export type SwitchSize = 'sm' | 'md';

export type SwitchClassOptions = {
  checked: boolean;
  size?: SwitchSize;
};

export type SwitchClasses = {
  track: string;
  thumb: string;
};

export function getSwitchClasses({ checked }: SwitchClassOptions): SwitchClasses {
  return {
    track: cn(
      'relative inline-flex items-center rounded-full transition-colors cursor-pointer shrink-0 w-9 h-5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500',
      checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
    ),
    thumb: cn(
      'inline-block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform pointer-events-none',
      checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
    ),
  };
}

export type CalloutVariant = 'info' | 'warning' | 'error' | 'success';

export type CalloutClassOptions = {
  variant?: CalloutVariant;
};

export type CalloutClasses = {
  container: string;
  title: string;
  icon: string;
};

const CALLOUT_THEMES: Record<CalloutVariant, CalloutClasses> = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300',
    title: 'font-bold text-blue-900 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400 shrink-0',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300',
    title: 'font-bold text-amber-900 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400 shrink-0',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300',
    title: 'font-bold text-red-900 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400 shrink-0',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    title: 'font-bold text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400 shrink-0',
  },
};

export function getCalloutClasses({ variant = 'info' }: CalloutClassOptions = {}): CalloutClasses {
  const theme = CALLOUT_THEMES[variant];
  return {
    container: cn('flex gap-3 p-3.5 rounded-2xl border text-xs leading-relaxed', theme.container),
    title: theme.title,
    icon: theme.icon,
  };
}

export type StatCardColor = 'emerald' | 'rose' | 'blue' | 'amber' | 'purple' | 'gray';

export type StatCardClassOptions = {
  color?: StatCardColor;
};

export type StatCardClasses = {
  container: string;
  value: string;
  label: string;
};

const STAT_CARD_THEMES: Record<StatCardColor, StatCardClasses> = {
  emerald: {
    container: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60',
    value: 'text-emerald-600 dark:text-emerald-400',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  rose: {
    container: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60',
    value: 'text-rose-600 dark:text-rose-400',
    label: 'text-rose-700 dark:text-rose-300',
  },
  blue: {
    container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60',
    value: 'text-blue-600 dark:text-blue-400',
    label: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60',
    value: 'text-amber-600 dark:text-amber-400',
    label: 'text-amber-700 dark:text-amber-300',
  },
  purple: {
    container: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60',
    value: 'text-purple-600 dark:text-purple-400',
    label: 'text-purple-700 dark:text-purple-300',
  },
  gray: {
    container: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
    value: 'text-gray-700 dark:text-gray-200',
    label: 'text-gray-500 dark:text-gray-400',
  },
};

export function getStatCardClasses({ color = 'gray' }: StatCardClassOptions = {}): StatCardClasses {
  const theme = STAT_CARD_THEMES[color];
  return {
    container: cn('p-3 rounded-2xl border text-center transition-colors', theme.container),
    value: cn('block text-xl sm:text-2xl font-black', theme.value),
    label: cn('text-[10px] font-bold uppercase tracking-wider', theme.label),
  };
}
