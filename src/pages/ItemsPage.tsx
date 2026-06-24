import { useState } from 'react';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import type { ItemInfo } from '../types';
import { useAppStore } from '../store';
import { getRarityStyles, getRarityText } from '../lib/rarity';
import { iconUrl } from '../lib/icons';
import { SectionHeader } from '../components/SectionHeader';
import { IconButton } from '../components/IconButton';
import { ItemDetailSheet } from '../components/ItemDetailSheet';

export const ItemsPage = ({ onBack }: { onBack: () => void }) => {
  const store = useAppStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ItemInfo | null>(null);
  const refinerLevel = store.getRefinerLevel();

  const items = Object.values(store.itemsInfo)
    .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="mb-3">
          <SectionHeader title="Oggetti"
            leading={
              <IconButton onClick={onBack} title="Indietro">
                <ArrowLeft size={16} />
              </IconButton>
            }
          />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Cerca un oggetto…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
      </div>

      <div className="p-3">
        {items.map(item => {
          const { color } = getRarityStyles(item.rarity);
          return (
            <button key={item.id} onClick={() => setSelected(item)}
              className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] text-left active:scale-[0.99] transition-transform">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
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
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="p-10 text-center text-gray-500 italic text-sm">Nessun oggetto trovato.</p>
        )}
      </div>

      {selected && <ItemDetailSheet item={selected} refinerLevel={refinerLevel} onClose={() => setSelected(null)} />}
    </div>
  );
};
