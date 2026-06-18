import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useScrollLock } from '../hooks/useScrollLock';

export type DrawerFrom = 'bottom' | 'top' | 'left' | 'right';

const panelClass: Record<DrawerFrom, string> = {
  bottom: 'bottom-0 left-0 right-0 rounded-t-[28px] max-h-[85vh]',
  top:    'top-0 left-0 right-0 rounded-b-[28px]',
  left:   'top-0 bottom-0 left-0 rounded-r-[28px] w-72',
  right:  'top-0 bottom-0 right-0 rounded-l-[28px] w-72',
};

export const Drawer = ({
  from = 'bottom',
  onClose,
  title,
  children,
}: {
  from?: DrawerFrom;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) => {
  useScrollLock();

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div
        className={`fixed bg-white dark:bg-gray-900 overflow-y-auto overscroll-contain ${panelClass[from]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 pb-2">
          {title ? <h2 className="text-base font-bold">{title}</h2> : <div />}
          <IconButton onClick={onClose} title="Chiudi">
            <X size={16} />
          </IconButton>
        </div>
        <div className="px-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
