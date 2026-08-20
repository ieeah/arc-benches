import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const CollapsibleSection = ({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => {
  const [prevOpen, setPrevOpen] = useState(open);
  const [isFullyOpen, setIsFullyOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setIsFullyOpen(false);
    }
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setIsFullyOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div className="mb-1 w-full min-w-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-1 py-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] sm:text-sm font-bold uppercase text-gray-400 tracking-wider truncate">{title}</span>
          {count !== undefined && (
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full shrink-0">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      {/* Grid trick: animates height from 0 → auto without knowing the target height */}
      <div
        className={`grid w-full min-w-0 transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        } ${isFullyOpen ? '' : 'overflow-hidden'}`}
      >
        <div className={`w-full min-w-0 ${isFullyOpen ? '' : 'overflow-hidden'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
