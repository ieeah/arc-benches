import { useState } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useScrollLock } from '../hooks/useScrollLock';

export type DrawerFrom = 'bottom' | 'top' | 'left' | 'right';

const DURATION_IN  = 280;
const DURATION_OUT = 200;

const panelClass: Record<DrawerFrom, string> = {
  bottom: 'bottom-0 left-0 right-0 rounded-t-[28px] max-h-[85vh]',
  top:    'top-0 left-0 right-0 rounded-b-[28px]',
  left:   'top-0 bottom-0 left-0 rounded-r-[28px] w-72',
  right:  'top-0 bottom-0 right-0 rounded-l-[28px] w-72',
};

const enterAnim: Record<DrawerFrom, string> = {
  top:    `drawer-slide-in-top    ${DURATION_IN}ms cubic-bezier(0.22,1,0.36,1) both`,
  bottom: `drawer-slide-in-bottom ${DURATION_IN}ms cubic-bezier(0.22,1,0.36,1) both`,
  left:   `drawer-slide-in-left   ${DURATION_IN}ms cubic-bezier(0.22,1,0.36,1) both`,
  right:  `drawer-slide-in-right  ${DURATION_IN}ms cubic-bezier(0.22,1,0.36,1) both`,
};

const exitAnim: Record<DrawerFrom, string> = {
  top:    `drawer-slide-out-top    ${DURATION_OUT}ms ease-in both`,
  bottom: `drawer-slide-out-bottom ${DURATION_OUT}ms ease-in both`,
  left:   `drawer-slide-out-left   ${DURATION_OUT}ms ease-in both`,
  right:  `drawer-slide-out-right  ${DURATION_OUT}ms ease-in both`,
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
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, DURATION_OUT - 10);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      style={{ animation: `${isClosing ? 'drawer-fade-out' : 'drawer-fade-in'} ${isClosing ? DURATION_OUT : DURATION_IN}ms ease both` }}
      onClick={handleClose}
    >
      <div
        className={`fixed bg-white dark:bg-gray-900 overflow-y-auto overscroll-contain ${panelClass[from]}`}
        style={{ animation: isClosing ? exitAnim[from] : enterAnim[from] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 pb-2">
          {title ? <h2 className="text-base font-bold">{title}</h2> : <div />}
          <IconButton onClick={handleClose} title="Chiudi">
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
