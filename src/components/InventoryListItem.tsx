import { useState } from 'react';
import { Plus, Minus, CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { useLongPress } from '@/hooks/useLongPress';
import { getRarityStyles } from '@/lib/rarity';
import { refinerCraftLevel } from '@/lib/craft';
import { ItemIcon } from '@/components/ItemIcon';
import type { ItemListDependency } from '@/store/selectors';

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
  const isCompleted = owned >= required;
  const longPressInc = useLongPress(onIncrement);
  const longPressDec = useLongPress(onDecrement);
  const { color, border, glow } = getRarityStyles(itemInfo?.rarity);
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
      className={`flex items-center gap-3 p-3 rounded-[24px] border-2 ${border} bg-white dark:bg-gray-900 transition-all ${
        isCompleted ? 'opacity-45 grayscale-[0.6]' : 'shadow-xs'
      }`}
    >
      {/* ── COLONNA SX: ICONA (ingrandita) ── */}
      <div className="flex flex-col items-center shrink-0">
        <div
          onClick={onOpenDetail}
          className={`relative w-16 h-16 sm:w-20 sm:h-20 aspect-square rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center cursor-pointer active:scale-95 transition-transform ${
            !isCompleted ? glow : ''
          }`}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            <ItemIcon
              icon={itemInfo?.icon}
              alt={itemInfo?.name}
              fallbackText={itemId.replace(/-/g, ' ')}
              imgClassName="max-w-full max-h-full object-contain scale-115"
            />
          </div>

          {/* Badge Refiner */}
          {craftLevel !== null && (
            <div
              title={
                craftableNow
                  ? 'Craftabile ora nel Refiner'
                  : `Richiede Refiner Lvl ${craftLevel} (sei a ${refinerLevel})`
              }
              className={`absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.2 rounded-full text-[7px] font-bold uppercase tracking-wide text-white ${
                craftableNow ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            >
              <Hammer size={8} />
              Ref{craftLevel === 2 ? ' II' : ''}
            </div>
          )}

          {/* Checkmark Completato */}
          {isCompleted && (
            <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
              <CheckCircle2
                size={22}
                className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg"
              />
            </div>
          )}

          {/* Barra rarità inferiore */}
          <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${color}`} />
        </div>
      </div>

      {/* ── COLONNA CENTRO: NOME & LISTE PER CUI È RICHIESTO ── */}
      <div
        onClick={onOpenDetail}
        className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer select-none pr-1"
      >
        <h4 className="text-sm sm:text-base font-bold truncate capitalize leading-tight text-gray-900 dark:text-gray-100 hover:text-blue-500 transition-colors">
          {itemInfo?.name ?? itemId.replace(/-/g, ' ')}
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

      {/* ── COLONNA DX: STEPPER VERTICALE ── */}
      <div className="flex flex-col items-center shrink-0 pl-1 self-center">
        {/* Gruppo Verticale Stepper: + in alto, input in mezzo, - in basso */}
        <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-0.5 shadow-2xs">
          <button
            onContextMenu={e => e.preventDefault()}
            onClick={onIncrement}
            {...longPressInc}
            aria-label={`Aumenta quantità ${itemInfo?.name ?? itemId}`}
            className="w-8 h-7 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl active:scale-90 transition-all shrink-0"
          >
            <Plus size={14} />
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={tempValue}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) {
                setTempValue(val);
              }
            }}
            onBlur={handleBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-8 h-6 text-center font-bold bg-transparent text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-lg text-gray-900 dark:text-gray-100"
          />

          <button
            onContextMenu={e => e.preventDefault()}
            onClick={onDecrement}
            {...longPressDec}
            aria-label={`Riduci quantità ${itemInfo?.name ?? itemId}`}
            className="w-8 h-7 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl active:scale-90 transition-all shrink-0"
          >
            <Minus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
