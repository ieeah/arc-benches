import { memo } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type HoldProgressOverlayProps = {
  isHolding: boolean;
  holdProgress: number;
  isComplete: boolean;
  className?: string;
};

export const HoldProgressOverlay = memo(function HoldProgressOverlay({
  isHolding,
  holdProgress,
  isComplete,
  className,
}: HoldProgressOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!isHolding || holdProgress <= 0) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden rounded-[inherit]',
        className
      )}
    >
      {/* Sfondo di riempimento progressivo che si intensifica durante la pressione */}
      <div
        style={{
          opacity: Math.min(0.45, holdProgress * 0.5),
        }}
        className={cn(
          'absolute inset-0 pointer-events-none',
          isComplete ? 'bg-rose-500' : 'bg-emerald-500'
        )}
      />

      {/* Cerchio centrale con icona: scala progressiva se motion consentito, altrimenti solo opacità senza movimento */}
      <div
        style={{
          transform: prefersReducedMotion ? 'none' : `scale(${Math.max(0.2, holdProgress * 2.8)})`,
          opacity: Math.min(0.95, holdProgress * 1.25),
        }}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg pointer-events-none',
          isComplete ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        )}
      >
        {isComplete ? (
          <RotateCcw size={18} className={prefersReducedMotion ? '' : 'animate-spin'} />
        ) : (
          <CheckCircle2 size={22} className="stroke-[3]" />
        )}
      </div>
    </div>
  );
});

export type BurstPingProps = {
  bursting: boolean;
  durationMs?: number;
  className?: string;
};

export const BurstPing = memo(function BurstPing({
  bursting,
  durationMs,
  className,
}: BurstPingProps) {
  const prefersReducedMotion = useReducedMotion();
  if (!bursting || prefersReducedMotion) return null;
  return (
    <div
      style={durationMs ? { animationDuration: `${durationMs}ms` } : undefined}
      className={cn(
        'absolute inset-0 bg-emerald-400/25 dark:bg-emerald-400/35 z-30 pointer-events-none animate-ping',
        className
      )}
    />
  );
});
