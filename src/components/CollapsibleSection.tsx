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
}) => (
  <div className="mb-1">
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between px-1 py-2 text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-[13px] sm:text-sm font-bold uppercase text-gray-400 tracking-wider">{title}</span>
        {count !== undefined && (
          <span className="text-[11px] sm:text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        size={15}
        className={`text-gray-400 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'rotate-0' : '-rotate-90'}`}
      />
    </button>

    {/* Grid trick: animates height from 0 → auto without knowing the target height */}
    <div
      className={`grid overflow-hidden transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  </div>
);
