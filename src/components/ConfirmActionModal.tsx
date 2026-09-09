import { Trash2, RotateCcw, Info } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmActionModalProps {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmActionModal({
  title,
  message,
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const { t } = useTranslation();

  const variantConfig = {
    danger: {
      icon: <Trash2 className="text-red-500" size={24} />,
      iconBg: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/50',
      confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
      defaultTitle: t('common.remove'),
      defaultConfirmText: t('common.remove'),
    },
    warning: {
      icon: <RotateCcw className="text-amber-500" size={24} />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
      defaultTitle: 'Conferma Operazione',
      defaultConfirmText: 'Ripristina',
    },
    primary: {
      icon: <Info className="text-blue-500" size={24} />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      defaultTitle: 'Conferma',
      defaultConfirmText: 'Conferma',
    },
  }[variant];

  return (
    <BottomSheet
      title={title || variantConfig.defaultTitle}
      onClose={onClose}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {cancelText || t('common.cancel')}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'flex-1 py-3 text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer',
              variantConfig.confirmButton
            )}
          >
            {confirmText || variantConfig.defaultConfirmText}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl border flex items-center justify-center shadow-2xs',
            variantConfig.iconBg
          )}
        >
          {variantConfig.icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {message}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
