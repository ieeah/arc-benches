import { CheckCircle2, Hammer } from 'lucide-react';
import type { ItemInfo, Workbench } from '../types';
import { refinerCraftLevel } from '../lib/craft';
import { LevelBadge } from './LevelBadge';

export const WorkbenchCard = ({ wb, currentLevel, itemsInfo, refinerLevel, onUpgrade, canUpgrade }: {
  wb: Workbench; currentLevel: number;
  itemsInfo: Record<string, ItemInfo>; refinerLevel: number;
  onUpgrade: () => void; canUpgrade: boolean;
}) => {
  const isMaxed = currentLevel >= wb.maxLevel;
  const nextLevelData = wb.levels.find(l => l.level === currentLevel + 1);

  if (isMaxed) {
    return (
      <div className="p-3 mb-3 rounded-[24px] border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-50">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-gray-400 dark:text-gray-600">{wb.name}</h3>
          <LevelBadge current={currentLevel} max={wb.maxLevel} state="maxed" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 mb-3 rounded-[24px] border-2 transition-all ${canUpgrade ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-base">{wb.name}</h3>
        <LevelBadge current={currentLevel} max={wb.maxLevel} state={canUpgrade ? 'ready' : 'default'} />
      </div>

      {nextLevelData && nextLevelData.requirementItemIds.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wider">Requisiti Lvl {currentLevel + 1}:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {nextLevelData.requirementItemIds.map(req => {
              const craftLevel = refinerCraftLevel(itemsInfo[req.itemId]);
              const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
              return (
                <div key={req.itemId} className="text-[10px] flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-xl gap-1">
                  <span className="truncate font-semibold capitalize flex items-center gap-1">
                    {craftLevel !== null && (
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
