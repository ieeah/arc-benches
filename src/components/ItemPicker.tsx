import { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useAppStore } from '../store';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { iconUrl } from '../lib/icons';
import { BottomSheet } from './BottomSheet';

/** Full-screen catalog picker over the whole item DB. Tap an item to pick it.
 *  Search bar is anchored to the bottom so the keyboard pushes it up,
 *  keeping results visible in the space above the keyboard. */
export const ItemPicker = ({ excludeIds = [], onPick, onClose }: {
  excludeIds?: string[];
  onPick: (item: ItemInfo) => void;
  onClose: () => void;
}) => {
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.toLowerCase().trim();
  const exclude = new Set(excludeIds);
  const items = Object.values(itemsInfo)
    .filter(i => !exclude.has(i.id) && i.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 80); // cap rendered rows; search narrows further

  // First tap on backdrop: dismiss keyboard (blur). Second tap: close picker.
  const handleBackdropClick = () => {
    if (document.activeElement === inputRef.current) inputRef.current?.blur();
    else onClose();
  };

  return (
    <BottomSheet
      title="Aggiungi oggetto"
      onClose={onClose}
      onBackdropClick={handleBackdropClick}
      overlayZ="z-[60]"
      bodyClassName="flex-1 min-h-0 px-3 pb-2 overflow-y-auto overscroll-contain"
      footer={
        <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              placeholder="Cerca tra tutti gli oggetti…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      }
    >
      {items.map(item => {
        const { color } = getRarityStyles(item.rarity);
        return (
          <button key={item.id} onClick={() => onPick(item)}
            className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
              {item.icon
                ? <img src={iconUrl(item.icon)} alt={item.name} loading="lazy" decoding="async" className="max-w-[85%] max-h-[85%] object-contain" />
                : <span className="text-[8px] text-gray-400">{item.id}</span>}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400">
                <span className={`font-bold ${getRarityText(item.rarity)}`}>{item.rarity}</span> · {item.item_type}
              </p>
            </div>
          </button>
        );
      })}
      {items.length === 0 && (
        <p className="p-10 text-center text-gray-500 italic text-sm">Nessun oggetto trovato.</p>
      )}
    </BottomSheet>
  );
};
