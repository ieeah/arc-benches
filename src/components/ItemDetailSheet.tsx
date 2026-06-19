import { Hammer } from 'lucide-react';
import type { ItemInfo } from '../types';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { refinerCraftLevel } from '../lib/craft';
import { iconUrl } from '../lib/icons';
import { BottomSheet } from './BottomSheet';

export const ItemDetailSheet = ({ item, refinerLevel, onClose }: {
  item: ItemInfo; refinerLevel: number; onClose: () => void;
}) => {
  const { color, glow } = getRarityStyles(item.rarity);
  const craftLevel = refinerCraftLevel(item);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;

  return (
    <BottomSheet
      title={item.name}
      onClose={onClose}
      bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-8"
      titleSlot={
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{item.name}</h2>
          <p className={`text-xs font-bold uppercase tracking-wide ${getRarityText(item.rarity)}`}>{item.rarity}</p>
        </div>
      }
    >
      <div className={`relative mx-auto w-40 h-40 mb-4 rounded-[24px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${glow}`}>
        {item.icon
          ? <img src={iconUrl(item.icon)} alt={item.name} decoding="async" className="max-w-[80%] max-h-[80%] object-contain" />
          : <span className="text-xs text-gray-400">{item.id}</span>}
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${color}`} />
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{item.description}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">Tipo</span>
          <span className="font-semibold">{item.item_type}{item.subcategory && item.subcategory !== item.item_type ? ` · ${item.subcategory}` : ''}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">Valore</span>
          <span className="font-semibold font-mono">{item.value.toLocaleString('it-IT')}</span>
        </div>
        {item.stack_size != null && item.stack_size > 1 && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">Stack</span>
            <span className="font-semibold font-mono">×{item.stack_size}</span>
          </div>
        )}
        {craftLevel !== null && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">Craft</span>
            <span className={`flex items-center gap-1.5 font-semibold ${craftableNow ? 'text-emerald-500' : 'text-amber-500'}`}>
              <Hammer size={14} />
              {craftableNow ? 'Craftabile ora' : `Richiede Refiner Lvl ${craftLevel}`}
            </span>
          </div>
        )}
        {item.loot_area && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">Zona loot</span>
            <span className="font-semibold">{item.loot_area}</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
