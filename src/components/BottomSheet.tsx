import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useScrollLock } from '../hooks/useScrollLock';
import { useDialog } from '../hooks/useDialog';
import { cn } from '../lib/cn';

/**
 * Shared overlay shell: bottom sheet on mobile, centered card on desktop.
 * Header (title or custom titleSlot + close) is fixed; `children` scroll; optional fixed `footer`.
 * Accessible via useDialog (role=dialog, focus trap, Esc, focus restore). `title` is the aria-label
 * even when a custom titleSlot is supplied.
 */
export const BottomSheet = ({
  title,
  titleSlot,
  onClose,
  onBackdropClick,
  footer,
  children,
  bodyClassName,
  overlayZ = 'z-50',
}: {
  title?: string;
  titleSlot?: React.ReactNode;
  onClose: () => void;
  /** Backdrop tap handler; defaults to onClose. Override to intercept (e.g. blur keyboard first). */
  onBackdropClick?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  overlayZ?: string;
}) => {
  useScrollLock();
  const panelRef = useDialog(onClose);

  return (
    <div className={cn('fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center', overlayZ)}
      onClick={onBackdropClick ?? onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] flex flex-col max-h-[85vh] focus:outline-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start gap-2 p-4 pb-2 shrink-0">
          {titleSlot ?? <h2 className="text-lg font-bold">{title}</h2>}
          <IconButton onClick={onClose} title="Chiudi">
            <X size={16} />
          </IconButton>
        </div>
        <div className={bodyClassName ?? 'flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4'}>
          {children}
        </div>
        {footer && <div className="shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
