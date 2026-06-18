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
      className="w-full flex items-center justify-between px-1 py-2 text-left"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        size={14}
        className={`text-gray-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
      />
    </button>
    {open && <div>{children}</div>}
  </div>
);
