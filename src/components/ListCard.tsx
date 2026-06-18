import { CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo, List } from '../types';
import { refinerCraftLevel } from '../lib/craft';
import { LevelBadge } from './LevelBadge';

export const ListCard = ({ list, currentLevel, itemsInfo, refinerLevel, inventory, totalRequired, onUpgrade, canUpgrade }: {
  list: List; currentLevel: number;
  itemsInfo: Record<string, ItemInfo>; refinerLevel: number;
  inventory: Record<string, number>;
  totalRequired: Record<string, number>;
  onUpgrade: () => void; canUpgrade: boolean;
}) => {
  const isMaxed = currentLevel >= list.maxLevel;
  const nextLevelData = list.levels.find(l => l.level === currentLevel + 1);

  if (isMaxed) {
    return (
      <div className="p-3 mb-3 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-gray-400 dark:text-gray-600">{list.name}</h3>
          <LevelBadge current={currentLevel} max={list.maxLevel} state="maxed" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 mb-3 rounded-[24px] border-2 transition-all ${canUpgrade ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base">{list.name}</h3>
        <LevelBadge current={currentLevel} max={list.maxLevel} state={canUpgrade ? 'ready' : 'default'} />
      </div>

      {nextLevelData && nextLevelData.requirementItemIds.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Requisiti Lvl {currentLevel + 1}:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {nextLevelData.requirementItemIds.map(req => {
              const craftLevel = refinerCraftLevel(itemsInfo[req.itemId]);
              const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
              const owned = inventory[req.itemId] ?? 0;
              // "Collected": owned covers this requirement AND everything the other active goals need
              const collected = owned >= req.quantity && owned >= (totalRequired[req.itemId] ?? 0);
              return (
                <div key={req.itemId}
                  className={`text-[10px] flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-xl gap-1 ${collected ? 'opacity-45' : ''}`}>
                  <span className="truncate font-semibold capitalize flex items-center gap-1">
                    {collected ? (
                      <CheckCircle2 size={10} className="shrink-0 text-green-500" aria-label="Già raccolto" />
                    ) : craftLevel !== null && (
                      <Hammer size={10}
                        className={`shrink-0 ${craftableNow ? 'text-emerald-500' : 'text-amber-500'}`}
                        aria-label={craftableNow ? 'Craftabile nel Refiner' : `Richiede Refiner Lvl ${craftLevel}`} />
                    )}
                    {itemsInfo[req.itemId]?.name ?? req.itemId.replace(/-/g, ' ')}
                  </span>
                  <span className="font-mono font-bold text-xs shrink-0">{req.quantity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canUpgrade && (
        <button onClick={onUpgrade}
          className="w-full mt-3 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm">
          <CheckCircle2 size={16} />
          COMPLETA POTENZIAMENTO
        </button>
      )}
    </div>
  );
};
