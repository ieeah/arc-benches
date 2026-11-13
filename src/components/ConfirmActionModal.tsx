import { Trash2, RotateCcw, Info } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export type ConfirmActionModalProps = {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onClose: () => void;
};

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
      defaultTitle: t('common.delete'),
      defaultConfirmText: t('common.delete'),
    },
    warning: {
      icon: <RotateCcw className="text-amber-500" size={24} />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50',
      defaultTitle: t('common.confirmAction'),
      defaultConfirmText: t('common.restore'),
    },
    primary: {
      icon: <Info className="text-blue-500" size={24} />,
      iconBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50',
      defaultTitle: t('common.confirm'),
      defaultConfirmText: t('common.confirm'),
    },
  }[variant];

  return (
    <BottomSheet
      title={title || variantConfig.defaultTitle}
      onClose={onClose}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
          <Button variant="secondary" onClick={onClose} fullWidth>
            {cancelText || t('common.cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            autoFocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            fullWidth
          >
            {confirmText || variantConfig.defaultConfirmText}
          </Button>
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
