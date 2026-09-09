import type { ItemInfo } from '@/types';
import { useTranslation, getItemName } from '@/i18n';
import { BottomSheet } from '@/components/BottomSheet';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';

export interface ConfirmDeleteItemModalProps {
  itemName: string;
  itemId: string;
  itemInfo?: ItemInfo;
  levelNum?: number;
  onConfirm: () => void;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function ConfirmDeleteItemModal({
  itemName,
  itemId,
  itemInfo,
  levelNum,
  onConfirm,
  onClose,
  title,
  message,
}: ConfirmDeleteItemModalProps) {
  const { t, language } = useTranslation();
  const localizedName = getItemName(itemInfo, language) || itemName;

  return (
    <BottomSheet
      title={title || t('customLists.deleteItemTitle')}
      onClose={onClose}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            {t('common.remove')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
        <ItemCardFrameV2
          icon={itemInfo?.icon ?? null}
          alt={localizedName}
          rarity={itemInfo?.rarity ?? 'Common'}
          fallbackText={itemId}
          className="w-14 h-14 shrink-0 rounded-2xl shadow-2xs"
          imgClassName="max-w-[85%] max-h-[85%] object-contain"
          compact
        />
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {message || t('customLists.deleteItemConfirm', { name: localizedName })}
          </p>
          {levelNum !== undefined && (
            <p className="text-xs text-gray-400 mt-1">
              {t('customLists.deleteItemStage', { level: levelNum })}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
