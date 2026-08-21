import { useState } from 'react';
import { CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles } from '@/lib/rarity';
import { refinerCraftLevel } from '@/lib/craft';
import { ItemCardFrame } from '@/components/ItemCardFrame';
import { QuantityStepper } from '@/components/QuantityStepper';
import type { ItemListDependency } from '@/store/selectors';
import { useTranslation, getItemName } from '@/i18n';

interface InventoryListItemProps {
  itemId: string;
  owned: number;
  required: number;
  itemInfo: ItemInfo | undefined;
  refinerLevel: number;
  dependencies: ItemListDependency[];
  onIncrement: () => void;
  onDecrement: () => void;
  onSet: (val: number) => void;
  onOpenDetail?: () => void;
}

export const InventoryListItem = ({
  itemId,
  owned,
  required,
  itemInfo,
  refinerLevel,
  dependencies,
  onIncrement,
  onDecrement,
  onSet,
  onOpenDetail,
}: InventoryListItemProps) => {
  const { language } = useTranslation();
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
    let val = parseInt(tempValue, 10);
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
      className={`flex items-center gap-3 p-3 rounded-[24px] card-concentric-24 squircle border-2 ${border} bg-white dark:bg-gray-900 transition-all ${
        isCompleted ? 'opacity-45 grayscale-[0.6]' : 'shadow-xs'
      }`}
    >
      {/* ── COLONNA SX: ICONA (ingrandita) ── */}
      <div className="flex flex-col items-center shrink-0">
        <ItemCardFrame
          icon={itemInfo?.icon}
          alt={displayName}
          rarity={itemInfo?.rarity}
          fallbackText={itemId.replace(/-/g, ' ')}
          onClick={onOpenDetail}
          className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 ${!isCompleted ? glow : ''}`}
          imgClassName="max-w-full max-h-full object-contain"
          topLeftSlot={
            craftLevel !== null ? (
              <div
                title={
                  craftableNow
                    ? 'Craftabile ora nel Refiner'
                    : `Richiede Refiner Lvl ${craftLevel} (sei a ${refinerLevel})`
                }
                className={`flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[7px] font-bold uppercase tracking-wide text-white ${
                  craftableNow ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              >
                <Hammer size={8} />
                Ref{craftLevel === 2 ? ' II' : ''}
              </div>
            ) : undefined
          }
          overlay={
            isCompleted ? (
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                <CheckCircle2
                  size={22}
                  className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg"
                />
              </div>
            ) : undefined
          }
        />
      </div>

      {/* ── COLONNA CENTRO: NOME & LISTE PER CUI È RICHIESTO ── */}
      <div
        onClick={onOpenDetail}
        className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer select-none pr-1"
      >
        <h4 className="text-sm sm:text-base font-bold truncate capitalize leading-tight text-gray-900 dark:text-gray-100 hover:text-blue-500 transition-colors">
          {displayName}
        </h4>

        {/* Posseduti / Richiesti sotto al titolo */}
        <p className="text-[11px] font-mono font-bold text-gray-400 mt-0.5">
          <span className="text-gray-800 dark:text-gray-200">{owned}</span> / {required}
        </p>

        {/* Lista banchi/liste dipendenti (1 visibile + contatore sotto se > 1) */}
        {dependencies.length > 0 ? (
          <div className="flex flex-col items-start gap-1 mt-1.5 max-w-full">
            {dependencies.slice(0, 1).map((dep, idx) => (
              <div
                key={`${dep.listId}-${dep.level}-${idx}`}
                className={`inline-flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold max-w-full ${
                  dep.isCustom
                    ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                }`}
              >
                <span className="truncate">{dep.listName}</span>
                <span className="opacity-75 font-semibold shrink-0">Lvl {dep.level}</span>
              </div>
            ))}
            {dependencies.length > 1 && (
              <div className="inline-flex items-center text-[10px] font-bold text-blue-500 dark:text-blue-400 pl-0.5">
                <span>+{dependencies.length - 1} {dependencies.length - 1 === 1 ? 'altro' : 'altri'}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 italic mt-1.5">Nessun obiettivo attivo</p>
        )}
      </div>

      {/* ── COLONNA DX: STEPPER VERTICALE CONCENTRO CON RARITY BORDER TINT ── */}
      <div className="flex flex-col items-center shrink-0 pl-1 self-center">
        <QuantityStepper
          orientation="vertical"
          tempValue={tempValue}
          onTempValueChange={setTempValue}
          onBlur={handleBlur}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          rarity={itemInfo?.rarity}
          itemName={displayName}
        />
      </div>
    </div>
  );
};
