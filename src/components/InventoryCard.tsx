import { useState } from 'react';
import { CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles } from '@/lib/rarity';
import { refinerCraftLevel } from '@/lib/craft';
import { ItemCardFrame } from '@/components/ItemCardFrame';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useTranslation, getItemName } from '@/i18n';

export const InventoryCard = ({
  itemId,
  owned,
  required,
  itemInfo,
  refinerLevel,
  onIncrement,
  onDecrement,
  onSet,
  onOpenDetail,
}: {
  itemId: string;
  owned: number;
  required: number;
  itemInfo: ItemInfo | undefined;
  refinerLevel: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (val: number) => void;
  onOpenDetail?: () => void;
}) => {
  const { t, language } = useTranslation();
  const displayName = getItemName(itemInfo, language) || itemId.replace(/-/g, ' ');
  const isCompleted = owned >= required;
  const { border, glow } = getRarityStyles(itemInfo?.rarity);
  const craftLevel = refinerCraftLevel(itemInfo);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
  const [prevOwned, setPrevOwned] = useState(owned);
  const [tempValue, setTempValue] = useState(owned.toString());

  if (owned !== prevOwned) {
    setPrevOwned(owned);
    setTempValue(owned.toString());
  }

  const handleBlur = () => {
    let val = parseInt(tempValue);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    if (val > required) {
      val = required;
    }
    onSet(val);
    setTempValue(val.toString());
  };

  return (
    <div
      className={`flex flex-col p-2.5 rounded-[28px] card-concentric-28 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all ${isCompleted ? 'opacity-40 grayscale-[0.8]' : ''}`}
    >
      <ItemCardFrame
        icon={itemInfo?.icon}
        alt={displayName}
        rarity={itemInfo?.rarity}
        fallbackText={itemId.replace(/-/g, ' ')}
        onClick={onOpenDetail}
        className={`mb-2 ${!isCompleted ? glow : ''}`}
        imgClassName="max-w-full max-h-full object-contain"
        topLeftSlot={
          craftLevel !== null ? (
            <div
              title={
                craftableNow
                  ? t('stash.craftableNowInRefiner')
                  : t('stash.requiresRefinerLevelShort', { level: craftLevel, current: refinerLevel })
              }
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide text-white ${
                craftableNow ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            >
              <Hammer size={9} />
              Refiner{craftLevel === 2 ? ' II' : ''}
            </div>
          ) : undefined
        }
        overlay={
          isCompleted ? (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg" />
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 min-w-0 mb-2 text-center">
        <h4 className="text-[13px] sm:text-sm font-bold truncate capitalize leading-tight mb-1">
          {displayName}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold font-mono">{owned}/{required}</p>
      </div>

      {/* ── CONTENITORE UNIFICATO STEPPER (Orizzontale Concentrico con Rarity Border Tint) ── */}
      <QuantityStepper
        orientation="horizontal"
        tempValue={tempValue}
        onTempValueChange={setTempValue}
        onBlur={handleBlur}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        rarity={itemInfo?.rarity}
        itemName={displayName}
      />
    </div>
  );
};
