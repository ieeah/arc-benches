import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, RotateCcw, SlidersHorizontal, EyeOff, Sparkles, MapPin, Hammer, Search } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { useAppStore } from '@/store';
import { getRarityStyles, getRarityText } from '@/lib/rarity';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { ItemDetailSheet } from '@/components/ItemDetailSheet';
import { ItemCardFrame } from '@/components/ItemCardFrame';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
const RARITY_WEIGHTS: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const LOOT_AREA_OPTIONS = [
  'ARC', 'Commercial', 'Electrical', 'Exodus', 'Industrial', 
  'Mechanical', 'Medical', 'Nature', 'Old World', 'Residential', 
  'Security', 'Technological'
];

const WORKBENCH_KEYWORDS = [
  'Refiner', 'Weapon Bench', 'Gunsmith', 'Med Station', 
  'Medical Lab', 'Utility Bench', 'Explosives Bench', 'Gear Bench', 'Equipment Bench'
];

type SortKey = 'name_asc' | 'name_desc' | 'rarity_desc' | 'rarity_asc' | 'value_desc' | 'value_asc' | 'type_asc' | 'stack_desc' | 'loot_asc';
type GroupKey = 'none' | 'item_type' | 'rarity' | 'loot_area' | 'workbench';

export const DevCatalogLabPage = ({ onBack }: { onBack: () => void }) => {
  const store = useAppStore();
  const allItems = useMemo(() => Object.values(store.itemsInfo), [store.itemsInfo]);
  const refinerLevel = store.getRefinerLevel();

  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);

  // --- Filtri di Ricerca Testuale ---
  const [query, setQuery] = useState('');
  const [searchInDesc, setSearchInDesc] = useState(false);

  // --- Toggles di Esclusione / Inclusione (Core Issue #13) ---
  const [hideCosmetics, setHideCosmetics] = useState(true);
  const [onlyDroppable, setOnlyDroppable] = useState(false);
  const [onlyCraftable, setOnlyCraftable] = useState(false);
  const [hideQuestItems, setHideQuestItems] = useState(false);
  const [hideKeys, setHideKeys] = useState(false);
  const [hideZeroValue, setHideZeroValue] = useState(false);

  // --- Filtri Specifici ---
  const [selectedRarities, setSelectedRarities] = useState<Set<string>>(new Set());
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const [selectedLootArea, setSelectedLootArea] = useState<string>('all');
  const [selectedWorkbench, setSelectedWorkbench] = useState<string>('all');
  const [minValue, setMinValue] = useState<number | ''>('');
  const [maxValue, setMaxValue] = useState<number | ''>('');

  // --- Ordinamento & Raggruppamento ---
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const [groupKey, setGroupKey] = useState<GroupKey>('none');
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);

  // Elenco unico di tutti gli item_type presenti
  const itemTypes = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(i => { if (i.item_type) set.add(i.item_type); });
    return Array.from(set).sort();
  }, [allItems]);

  // Reset all filters
  const handleReset = () => {
    setQuery('');
    setSearchInDesc(false);
    setHideCosmetics(false);
    setOnlyDroppable(false);
    setOnlyCraftable(false);
    setHideQuestItems(false);
    setHideKeys(false);
    setHideZeroValue(false);
    setSelectedRarities(new Set());
    setSelectedItemType('all');
    setSelectedLootArea('all');
    setSelectedWorkbench('all');
    setMinValue('');
    setMaxValue('');
    setSortKey('name_asc');
    setGroupKey('none');
  };

  const toggleRarity = (r: string) => {
    const next = new Set(selectedRarities);
    if (next.has(r)) next.delete(r);
    else next.add(r);
    setSelectedRarities(next);
  };

  // Pipeline di filtraggio
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter(item => {
      // 1. Toggles Esclusione
      if (hideCosmetics && item.item_type?.toLowerCase() === 'cosmetic') return false;
      if (hideQuestItems && item.item_type?.toLowerCase() === 'quest item') return false;
      if (hideKeys && item.item_type?.toLowerCase() === 'key') return false;
      if (hideZeroValue && item.value === 0) return false;

      if (onlyDroppable && (!item.loot_area || item.loot_area.trim() === '')) return false;
      if (onlyCraftable && (!item.workbench || item.workbench.trim() === '')) return false;

      // 2. Filtro Rarità
      if (selectedRarities.size > 0 && !selectedRarities.has(item.rarity)) return false;

      // 3. Filtro Tipo Oggetto
      if (selectedItemType !== 'all' && item.item_type !== selectedItemType) return false;

      // 4. Filtro Zona Loot
      if (selectedLootArea !== 'all') {
        if (!item.loot_area || !item.loot_area.toLowerCase().includes(selectedLootArea.toLowerCase())) return false;
      }

      // 5. Filtro Banco
      if (selectedWorkbench !== 'all') {
        if (!item.workbench || !item.workbench.toLowerCase().includes(selectedWorkbench.toLowerCase())) return false;
      }

      // 6. Range Valore
      if (minValue !== '' && item.value < Number(minValue)) return false;
      if (maxValue !== '' && item.value > Number(maxValue)) return false;

      // 7. Ricerca Testuale
      if (q.length > 0) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesSub = item.subcategory?.toLowerCase().includes(q) ?? false;
        const matchesType = item.item_type?.toLowerCase().includes(q) ?? false;
        const matchesLoot = item.loot_area?.toLowerCase().includes(q) ?? false;
        const matchesWb = item.workbench?.toLowerCase().includes(q) ?? false;
        const matchesDesc = searchInDesc && item.description?.toLowerCase().includes(q);

        if (!matchesName && !matchesId && !matchesSub && !matchesType && !matchesLoot && !matchesWb && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [
    allItems, query, searchInDesc, hideCosmetics, onlyDroppable, onlyCraftable,
    hideQuestItems, hideKeys, hideZeroValue, selectedRarities, selectedItemType,
    selectedLootArea, selectedWorkbench, minValue, maxValue
  ]);

  // Pipeline di ordinamento
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      switch (sortKey) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'rarity_desc':
          return (RARITY_WEIGHTS[b.rarity.toLowerCase()] ?? 0) - (RARITY_WEIGHTS[a.rarity.toLowerCase()] ?? 0) || a.name.localeCompare(b.name);
        case 'rarity_asc':
          return (RARITY_WEIGHTS[a.rarity.toLowerCase()] ?? 0) - (RARITY_WEIGHTS[b.rarity.toLowerCase()] ?? 0) || a.name.localeCompare(b.name);
        case 'value_desc':
          return b.value - a.value || a.name.localeCompare(b.name);
        case 'value_asc':
          return a.value - b.value || a.name.localeCompare(b.name);
        case 'type_asc':
          return (a.item_type || '').localeCompare(b.item_type || '') || a.name.localeCompare(b.name);
        case 'stack_desc':
          return (b.stack_size ?? 1) - (a.stack_size ?? 1) || a.name.localeCompare(b.name);
        case 'loot_asc':
          return (a.loot_area || 'zzz').localeCompare(b.loot_area || 'zzz') || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filteredItems, sortKey]);

  // Raggruppamento
  const groupedData = useMemo(() => {
    if (groupKey === 'none') return null;

    const map = new Map<string, ItemInfo[]>();
    sortedItems.forEach(item => {
      let key = 'Altro';
      if (groupKey === 'item_type') key = item.item_type || 'Nessun Tipo';
      else if (groupKey === 'rarity') key = item.rarity || 'Common';
      else if (groupKey === 'loot_area') key = item.loot_area || 'Non in mappa / Craft o Quest';
      else if (groupKey === 'workbench') key = item.workbench || 'Non craftabile';

      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });

    return Array.from(map.entries());
  }, [sortedItems, groupKey]);

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="p-4 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-20 border-b border-gray-200 dark:border-gray-800 space-y-3">
        <SectionHeader
          title="🧪 Dev Catalog Lab"
          leading={
            <IconButton onClick={onBack} title="Indietro">
              <ArrowLeft size={16} />
            </IconButton>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                title="Reset filtri"
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-600 dark:text-gray-300 font-medium"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`p-1.5 rounded-xl border transition-colors ${
                  showFiltersPanel
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
                title="Mostra/Nascondi controlli filtri"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          }
        />

        {/* Counter Badge Bar */}
        <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-xl font-medium">
          <span>Mostrati: <strong>{sortedItems.length}</strong> / {allItems.length}</span>
          <span>Nascosti: <strong>{allItems.length - sortedItems.length}</strong></span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca per nome, id, zona, tipo, banco..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Pannello Controlli di Filtro Espandibile */}
      {showFiltersPanel && (
        <div className="p-4 bg-gray-100/70 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 space-y-4 text-xs">
          {/* 1. Toggles Esclusione Issue #13 */}
          <div>
            <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
              <EyeOff size={12} /> Toggles di Esclusione Rapida (Issue #13)
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setHideCosmetics(!hideCosmetics)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  hideCosmetics
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {hideCosmetics ? '🚫 Skin / Cosmetici Nascosti' : '👁️ Mostra Cosmetici'}
              </button>

              <button
                onClick={() => setOnlyDroppable(!onlyDroppable)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  onlyDroppable
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {onlyDroppable ? '📍 Solo Droppabili in Mappa' : '📍 Tutte le sorgenti'}
              </button>

              <button
                onClick={() => setOnlyCraftable(!onlyCraftable)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  onlyCraftable
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {onlyCraftable ? '🔨 Solo Craftabili ai Banchi' : '🔨 Tutti i craft'}
              </button>

              <button
                onClick={() => setHideQuestItems(!hideQuestItems)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  hideQuestItems
                    ? 'bg-purple-500 text-white border-purple-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {hideQuestItems ? '🚫 Quest Items Nascosti' : '📜 Mostra Quest Items'}
              </button>

              <button
                onClick={() => setHideKeys(!hideKeys)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  hideKeys
                    ? 'bg-indigo-500 text-white border-indigo-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {hideKeys ? '🚫 Chiavi Nascoste' : '🔑 Mostra Chiavi'}
              </button>

              <button
                onClick={() => setHideZeroValue(!hideZeroValue)}
                className={`px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                  hideZeroValue
                    ? 'bg-gray-700 text-white border-gray-800'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {hideZeroValue ? '🚫 Valore 0 Nascosto' : '💰 Tutti i Valori'}
              </button>
            </div>
          </div>

          {/* 2. Filtro Rarità Multiplo */}
          <div>
            <p className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} /> Rarità (Multi-selezione)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RARITIES.map(r => {
                const active = selectedRarities.has(r);
                const { color } = getRarityStyles(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRarity(r)}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Dropdowns Macro-Filtri */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo Oggetto</label>
              <select
                value={selectedItemType}
                onChange={e => setSelectedItemType(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs focus:outline-none"
              >
                <option value="all">Tutti i tipi ({itemTypes.length})</option>
                {itemTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zona di Loot</label>
              <select
                value={selectedLootArea}
                onChange={e => setSelectedLootArea(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs focus:outline-none"
              >
                <option value="all">Tutte le zone ({LOOT_AREA_OPTIONS.length})</option>
                {LOOT_AREA_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Banco di Lavoro</label>
              <select
                value={selectedWorkbench}
                onChange={e => setSelectedWorkbench(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs focus:outline-none"
              >
                <option value="all">Tutti i banchi</option>
                {WORKBENCH_KEYWORDS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Range Valore (Coins)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minValue}
                  onChange={e => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxValue}
                  onChange={e => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 4. Ordinamento & Raggruppamento */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ordinamento</label>
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="rarity_desc">Rarità (Decrescente)</option>
                <option value="rarity_asc">Rarità (Crescente)</option>
                <option value="value_desc">Valore (Più costosi)</option>
                <option value="value_asc">Valore (Meno costosi)</option>
                <option value="type_asc">Tipo Oggetto (A-Z)</option>
                <option value="stack_desc">Stack Size (Massimo)</option>
                <option value="loot_asc">Zona Loot (A-Z)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Raggruppamento</label>
              <select
                value={groupKey}
                onChange={e => setGroupKey(e.target.value as GroupKey)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="none">Nessun Raggruppamento</option>
                <option value="item_type">Per Tipo Oggetto</option>
                <option value="rarity">Per Rarità</option>
                <option value="loot_area">Per Zona di Loot</option>
                <option value="workbench">Per Banco di Lavoro</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista Risultati */}
      <div data-list-container="compact" className="p-3">
        {groupedData ? (
          groupedData.map(([groupName, items]) => (
            <div key={groupName} className="mb-6">
              <div className="flex items-center justify-between mb-2 px-1 border-b border-gray-200 dark:border-gray-800 pb-1">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {groupName}
                </h3>
                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {items.map(item => (
                <ItemCard key={item.id} item={item} onSelect={setSelectedItem} />
              ))}
            </div>
          ))
        ) : (
          sortedItems.map(item => (
            <ItemCard key={item.id} item={item} onSelect={setSelectedItem} />
          ))
        )}

        {sortedItems.length === 0 && (
          <div className="py-20 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium">Nessun oggetto corrisponde ai filtri selezionati.</p>
            <button
              onClick={handleReset}
              className="text-xs text-blue-500 underline font-semibold"
            >
              Reimposta tutti i filtri
            </button>
          </div>
        )}
      </div>

      {/* Sheet di Dettaglio */}
      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          refinerLevel={refinerLevel}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

const ItemCard = ({ item, onSelect }: { item: ItemInfo; onSelect: (i: ItemInfo) => void }) => {
  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform"
    >
      <ItemCardFrame
        icon={item.icon}
        alt={item.name}
        rarity={item.rarity}
        fallbackText={item.id}
        className="w-12 h-12 shrink-0"
        imgClassName="max-w-[85%] max-h-[85%] object-contain"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm truncate">{item.name}</p>
          {item.item_type?.toLowerCase() === 'cosmetic' && (
            <span className="text-[9px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold px-1.5 py-0.2 rounded-md shrink-0">
              Skin
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-400">
          <span className={`font-bold ${getRarityText(item.rarity)}`}>{item.rarity}</span> · {item.item_type || 'Misc'}
          {item.subcategory && ` (${item.subcategory})`}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
          <span>🪙 {item.value}</span>
          {item.stack_size && <span>📦 ×{item.stack_size}</span>}
          {item.loot_area && (
            <span className="truncate flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
              <MapPin size={9} /> {item.loot_area}
            </span>
          )}
          {item.workbench && (
            <span className="truncate flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <Hammer size={9} /> {item.workbench}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
    </button>
  );
};