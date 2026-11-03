import { useState } from 'react';
import type { ItemInfo } from '@/types';
import { getRarityStyles } from '@/lib/rarity';
import { refinerCraftLevel } from '@/lib/craft';
import { getTraderPurchase } from '@/lib/traders';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { QuantityStepper } from '@/components/QuantityStepper';
import { RefinerBadge } from '@/components/RefinerBadge';
import { TraderBadge } from '@/components/TraderBadge';
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
  const traderPurchase = getTraderPurchase(itemId);
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
      className={`flex flex-col p-2.5 rounded-[28px] card-concentric-28 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all ${isCompleted ? 'opacity-60 grayscale-[0.45]' : ''}`}
    >
      <ItemCardFrameV2
        icon={itemInfo?.icon}
        alt={displayName}
        rarity={itemInfo?.rarity}
        fallbackText={itemId.replace(/-/g, ' ')}
        onClick={onOpenDetail}
        className={`mb-2 ${!isCompleted ? glow : ''}`}
        imgClassName="max-w-full max-h-full object-contain"
        topLeftSlot={
          (craftLevel !== null || traderPurchase !== null) ? (
            <div className="flex items-center gap-1 max-w-[calc(100%-1.5rem)]">
              {craftLevel !== null && (
                <RefinerBadge
                  craftLevel={craftLevel}
                  craftableNow={craftableNow}
                  shortLabel={traderPurchase !== null}
                  title={
                    craftableNow
                      ? t('stash.craftableNowInRefiner')
                      : t('stash.requiresRefinerLevelShort', { level: craftLevel, current: refinerLevel })
                  }
                />
              )}
              {traderPurchase !== null && (
                <TraderBadge
                  trader={traderPurchase.trader}
                  price={traderPurchase.price}
                  title={t('stash.purchasableFromTrader', {
                    trader: traderPurchase.trader,
                    price: traderPurchase.price.toLocaleString(),
                  })}
                />
              )}
            </div>
          ) : undefined
        }
        categoryBadge={<CategoryBadge itemType={itemInfo?.item_type} subcategory={itemInfo?.subcategory} bare />}
        completed={isCompleted}
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
