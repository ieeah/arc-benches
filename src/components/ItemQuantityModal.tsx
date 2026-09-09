import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { useTranslation, getItemName, getItemDescription, getRarityLabel } from '@/i18n';
import { BottomSheet } from '@/components/BottomSheet';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { QuantityStepper } from '@/components/QuantityStepper';
import { getRarityText } from '@/lib/rarity';

export interface ItemQuantityModalProps {
  item: ItemInfo;
  initialQuantity?: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
  onChangeItem?: (currentQuantity: number) => void;
  title?: string;
  confirmLabel?: string;
}

export function ItemQuantityModal({
  item,
  initialQuantity = 1,
  onConfirm,
  onClose,
  onChangeItem,
  title,
  confirmLabel,
}: ItemQuantityModalProps) {
  const { t, language } = useTranslation();
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [tempValue, setTempValue] = useState(String(quantity));

  const itemName = getItemName(item, language) || item.name;
  const itemDesc = getItemDescription(item, language);
  const rarityLabel = getRarityLabel(item.rarity, language);

  const handleTempValueChange = (val: string) => {
    setTempValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const handleBlur = () => {
    let parsed = parseInt(tempValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      parsed = 1;
    }
    setQuantity(parsed);
    setTempValue(String(parsed));
  };

  const adjustQty = (delta: number) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    setTempValue(String(next));
  };

  const setExact = (val: number) => {
    const next = Math.max(1, val);
    setQuantity(next);
    setTempValue(String(next));
  };

  return (
    <BottomSheet
      title={title || t('quantityModal.title')}
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
            onClick={() => onConfirm(quantity)}
            className="flex-2 py-3 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{confirmLabel || t('quantityModal.addToList', { quantity })}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center py-2 space-y-4">
        {/* Item preview card */}
        <div className="w-full flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-[22px] border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <ItemCardFrameV2
              icon={item.icon}
              alt={itemName}
              rarity={item.rarity}
              fallbackText={item.id}
              className="w-14 h-14 shrink-0 rounded-2xl shadow-2xs"
              imgClassName="max-w-[85%] max-h-[85%] object-contain"
              compact
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                {itemName}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                <span className={`font-bold ${getRarityText(item.rarity)}`}>{rarityLabel}</span>
                {item.item_type ? ` · ${item.item_type}` : ''}
                {item.stack_size ? ` · Stack: ${item.stack_size}` : ''}
              </p>
              {itemDesc && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 mt-1">
                  {itemDesc}
                </p>
              )}
            </div>
          </div>

          {onChangeItem && (
            <button
              type="button"
              onClick={() => onChangeItem(quantity)}
              className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              title="Cambia oggetto"
            >
              <RefreshCw size={13} />
              <span>Cambia</span>
            </button>
          )}
        </div>

        {/* Quantity selector */}
        <div className="w-full flex flex-col items-center gap-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('quantityModal.requiredQty')}
          </label>
          <div className="w-48">
            <QuantityStepper
              orientation="horizontal"
              tempValue={tempValue}
              onTempValueChange={handleTempValueChange}
              onBlur={handleBlur}
              onIncrement={() => adjustQty(1)}
              onDecrement={() => adjustQty(-1)}
              rarity={item.rarity}
              itemName={itemName}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {[1, 2, 5, 10, 25, 50, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setExact(val)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quantity === val
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {val}
              </button>
            ))}
            {item.stack_size && ![1, 2, 5, 10, 25, 50, 100].includes(item.stack_size) && (
              <button
                type="button"
                onClick={() => setExact(item.stack_size!)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quantity === item.stack_size
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Stack ({item.stack_size})
              </button>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
