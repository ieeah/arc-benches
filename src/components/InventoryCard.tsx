import { Plus, Minus, CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useLongPress } from '../hooks/useLongPress';
import { getRarityStyles } from '../lib/rarity';
import { refinerCraftLevel } from '../lib/craft';
import { iconUrl } from '../lib/icons';

export const InventoryCard = ({ itemId, owned, required, itemInfo, refinerLevel, onIncrement, onDecrement, onSet }: {
  itemId: string; owned: number; required: number;
  itemInfo: ItemInfo | undefined; refinerLevel: number;
  onIncrement: () => void; onDecrement: () => void; onSet: (val: number) => void;
}) => {
  const isCompleted = owned >= required;
  const longPressInc = useLongPress(onIncrement);
  const longPressDec = useLongPress(onDecrement);
  const { color, border, glow } = getRarityStyles(itemInfo?.rarity);
  const craftLevel = refinerCraftLevel(itemInfo);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;

  return (
    <div className={`flex flex-col p-2.5 rounded-[28px] border-2 ${border} bg-white dark:bg-gray-900 transition-all ${isCompleted ? 'opacity-40 grayscale-[0.8]' : ''}`}>
      <div className={`relative mb-2 aspect-square rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${!isCompleted ? glow : ''}`}>
        <div className="w-16 h-16 flex items-center justify-center">
          {itemInfo?.icon
            ? <img src={iconUrl(itemInfo.icon)} alt={itemInfo.name} loading="lazy" decoding="async" className="max-w-full max-h-full object-contain scale-110" />
            : <span className="text-[9px] text-gray-400 text-center leading-tight">{itemId.replace(/-/g, ' ')}</span>
          }
        </div>
        {craftLevel !== null && (
          <div
            title={craftableNow
              ? 'Craftabile ora nel Refiner'
              : `Richiede Refiner Lvl ${craftLevel} (sei a ${refinerLevel})`}
            className={`absolute top-2.5 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide text-white ${craftableNow ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            <Hammer size={9} />
            Refiner{craftLevel === 2 ? ' II' : ''}
          </div>
        )}
        {itemInfo?.stack_size != null && itemInfo.stack_size > 1 && (
          <div title={`Impilabile fino a ${itemInfo.stack_size}`}
            className="absolute top-2.5 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono bg-black/55 text-white">
            ×{itemInfo.stack_size}
          </div>
        )}
        {isCompleted && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg" />
          </div>
        )}
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${color}`} />
      </div>

      <div className="flex-1 min-w-0 mb-2 text-center">
        <h4 className="text-[10px] font-bold truncate capitalize leading-tight mb-1">
          {itemInfo?.name ?? itemId.replace(/-/g, ' ')}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold font-mono">{owned}/{required}</p>
      </div>

      <div className="flex items-center gap-1">
        <button onContextMenu={e => e.preventDefault()} onClick={onDecrement} {...longPressDec}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl active:scale-95 transition-transform shrink-0">
          <Minus size={14} />
        </button>
        <input
          type="number" inputMode="numeric" pattern="[0-9]*"
          value={owned} onChange={e => onSet(parseInt(e.target.value) || 0)}
          className="w-0 flex-1 h-8 text-center font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
        />
        <button onContextMenu={e => e.preventDefault()} onClick={onIncrement} {...longPressInc}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl active:scale-95 transition-transform shrink-0">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
