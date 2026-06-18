import { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useAppStore } from '../store';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { iconUrl } from '../lib/icons';
import { IconButton } from './IconButton';
import { useScrollLock } from '../hooks/useScrollLock';

/** Full-screen catalog picker over the whole item DB. Tap an item to pick it. */
export const ItemPicker = ({ excludeIds = [], onPick, onClose }: {
  excludeIds?: string[];
  onPick: (item: ItemInfo) => void;
  onClose: () => void;
}) => {
  useScrollLock();
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();
  const exclude = new Set(excludeIds);
  const items = Object.values(itemsInfo)
    .filter(i => !exclude.has(i.id) && i.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 80); // cap rendered rows; search narrows further

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center"
      onClick={e => { e.stopPropagation(); onClose(); }}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Aggiungi oggetto</h2>
            <IconButton onClick={onClose} title="Chiudi">
              <X size={16} />
            </IconButton>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="Cerca tra tutti gli oggetti…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        <div className="p-3 overflow-y-auto overscroll-contain">
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
        </div>
      </div>
    </div>
  );
};
