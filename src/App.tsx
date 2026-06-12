import { useState, useRef, useEffect } from 'react';
import { useAppStore } from './store';
import {
  Backpack, Home, Settings as SettingsIcon,
  Plus, Minus, CheckCircle2, Sun, Moon, RotateCcw, GripVertical,
  ArrowUp, ArrowDown, Hammer, Database, ArrowLeft, ChevronRight, Search, X,
} from 'lucide-react';
import type { ItemInfo, Workbench } from './types';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- THEME ---

function safeLS<T>(op: () => T, fallback: T): T {
  try { return op(); } catch { return fallback; }
}

function useTheme() {
  const [dark, setDark] = useState(() =>
    safeLS(() => {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }, false)
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    safeLS(() => localStorage.setItem('theme', dark ? 'dark' : 'light'), undefined);
  }, [dark]);
  return { dark, toggle: () => setDark(d => !d) };
}

// --- HELPERS ---

const useLongPress = (callback: () => void, ms = 100) => {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (active) { timer.current = setInterval(callback, ms); }
    else if (timer.current) { clearInterval(timer.current); }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [active, callback, ms]);
  return {
    onMouseDown: () => setActive(true), onMouseUp: () => setActive(false), onMouseLeave: () => setActive(false),
    onTouchStart: () => setActive(true), onTouchEnd: () => setActive(false),
  };
};

const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const rarityStyles: Record<string, { color: string; glow: string }> = {
  common:    { color: 'bg-gray-400',   glow: 'shadow-[0_8px_20px_-4px_rgba(156,163,175,0.6)]' },
  uncommon:  { color: 'bg-green-500',  glow: 'shadow-[0_8px_20px_-4px_rgba(34,197,94,0.6)]' },
  rare:      { color: 'bg-blue-500',   glow: 'shadow-[0_8px_20px_-4px_rgba(59,130,246,0.6)]' },
  epic:      { color: 'bg-purple-500', glow: 'shadow-[0_8px_20px_-4px_rgba(168,85,247,0.6)]' },
  legendary: { color: 'bg-orange-500', glow: 'shadow-[0_8px_20px_-4px_rgba(249,115,22,0.6)]' },
};
const getRarityStyles = (rarity?: string) => rarityStyles[rarity?.toLowerCase() ?? ''] ?? rarityStyles.common;

const rarityText: Record<string, string> = {
  common: 'text-gray-400', uncommon: 'text-green-500', rare: 'text-blue-500',
  epic: 'text-purple-500', legendary: 'text-orange-500',
};
const getRarityText = (rarity?: string) => rarityText[rarity?.toLowerCase() ?? ''] ?? rarityText.common;

type SortKey = 'priority' | 'name' | 'rarity' | 'type';
type SortDir = 1 | -1;

/** Refiner level required to craft the item, or null if it can't be crafted (from MetaForge `workbench` field). */
const refinerCraftLevel = (itemInfo?: ItemInfo): number | null => {
  const wb = itemInfo?.workbench;
  if (!wb?.toLowerCase().startsWith('refiner')) return null;
  return wb.trim().endsWith('II') ? 2 : 1;
};

// --- SHARED COMPONENTS ---

const ThemeToggle = ({ dark, onToggle }: { dark: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full transition-colors shrink-0">
    {dark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-gray-500" />}
  </button>
);

/** Page title bar — theme toggle always rightmost, extra actions to its left. */
const SectionHeader = ({ title, actions, dark, onToggleTheme }: {
  title: string; actions?: React.ReactNode; dark: boolean; onToggleTheme: () => void;
}) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold">{title}</h1>
    <div className="flex items-center gap-2">
      {actions}
      <ThemeToggle dark={dark} onToggle={onToggleTheme} />
    </div>
  </div>
);

const LevelBadge = ({ current, max, state = 'default' }: {
  current: number; max: number; state?: 'ready' | 'maxed' | 'default';
}) => (
  <span className={`text-sm font-bold shrink-0 ${
    state === 'ready' ? 'text-green-500'
    : state === 'maxed' ? 'text-gray-400 dark:text-gray-600'
    : 'text-blue-400'
  }`}>
    Lvl {current}/{max}
  </span>
);

/** Row of tappable level pills (min..max). Levels below minSelectable are disabled. */
const LevelPills = ({ min = 0, max, value, minSelectable = 0, activeClass, onChange }: {
  min?: number; max: number; value: number; minSelectable?: number; activeClass: string; onChange: (v: number) => void;
}) => (
  <div className="flex gap-1.5 flex-wrap">
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(lvl => {
      const disabled = lvl < minSelectable;
      return (
        <button key={lvl} onClick={() => onChange(lvl)} disabled={disabled}
          className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
            lvl === value ? activeClass
            : disabled ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
          {lvl}
        </button>
      );
    })}
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ size: number }>; label: string;
}) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${active ? 'text-blue-500' : 'text-gray-500'}`}>
    <Icon size={24} />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

// --- STASH ---

const InventoryCard = ({ itemId, owned, required, itemInfo, refinerLevel, onIncrement, onDecrement, onSet }: {
  itemId: string; owned: number; required: number; itemInfo: ItemInfo | undefined; refinerLevel: number;
  onIncrement: () => void; onDecrement: () => void; onSet: (val: number) => void;
}) => {
  const isCompleted = owned >= required;
  const longPressInc = useLongPress(onIncrement);
  const longPressDec = useLongPress(onDecrement);
  const { color, glow } = getRarityStyles(itemInfo?.rarity);
  const craftLevel = refinerCraftLevel(itemInfo);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;

  return (
    <div className={`flex flex-col p-2.5 rounded-[28px] border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all ${isCompleted ? 'opacity-40 grayscale-[0.8]' : ''}`}>
      <div className={`relative mb-2 aspect-square rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${!isCompleted ? glow : ''}`}>
        <div className="w-16 h-16 flex items-center justify-center">
          {itemInfo?.icon
            ? <img src={itemInfo.icon} alt={itemInfo.name} className="max-w-full max-h-full object-contain scale-110" />
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
          className="w-0 flex-1 text-center font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-xs"
        />
        <button onContextMenu={e => e.preventDefault()} onClick={onIncrement} {...longPressInc}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl active:scale-95 transition-transform shrink-0">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

// --- RIFUGIO ---

const WorkbenchCard = ({ wb, currentLevel, itemsInfo, refinerLevel, onUpgrade, canUpgrade }: {
  wb: Workbench; currentLevel: number; itemsInfo: Record<string, ItemInfo>; refinerLevel: number;
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

// --- OBIETTIVI ---

const SortableWorkbenchRow = ({ wb, current, target, isActive, onToggle, onCurrentLevel, onTargetLevel }: {
  wb: Workbench; current: number; target: number; isActive: boolean;
  onToggle: () => void; onCurrentLevel: (v: number) => void; onTargetLevel: (v: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: wb.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  // A workbench whose level 1 has no requirements starts already unlocked (e.g. Scrappy) — level 0 doesn't exist
  const baseLevel = wb.levels.find(l => l.level === 1)?.requirementItemIds.length === 0 ? 1 : 0;

  return (
    <div ref={setNodeRef} style={style}
      className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button {...attributes} {...listeners}
          className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing">
          <GripVertical size={18} />
        </button>
        <span className="font-bold flex-1">{wb.name}</span>
        <LevelBadge current={current} max={wb.maxLevel} state={current >= wb.maxLevel ? 'maxed' : 'default'} />
        <input type="checkbox" checked={isActive} onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer" />
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
          <LevelPills min={baseLevel} max={wb.maxLevel} value={current}
            activeClass="bg-blue-500 text-white" onChange={onCurrentLevel} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Obiettivo</p>
          <LevelPills min={baseLevel} max={wb.maxLevel} value={target} minSelectable={current + 1}
            activeClass="bg-green-500 text-white" onChange={onTargetLevel} />
        </div>
      </div>
    </div>
  );
};

// --- OGGETTI (database) ---

const ItemDetailSheet = ({ item, refinerLevel, onClose }: {
  item: ItemInfo; refinerLevel: number; onClose: () => void;
}) => {
  const { color, glow } = getRarityStyles(item.rarity);
  const craftLevel = refinerCraftLevel(item);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{item.name}</h2>
            <p className={`text-xs font-bold uppercase tracking-wide ${getRarityText(item.rarity)}`}>{item.rarity}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full shrink-0 ml-3">
            <X size={16} />
          </button>
        </div>

        <div className={`relative mx-auto w-40 h-40 mb-4 rounded-[24px] overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${glow}`}>
          {item.icon
            ? <img src={item.icon} alt={item.name} className="max-w-[80%] max-h-[80%] object-contain" />
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
      </div>
    </div>
  );
};

const ItemsPage = ({ itemsInfo, refinerLevel, dark, onToggleTheme, onBack }: {
  itemsInfo: Record<string, ItemInfo>; refinerLevel: number;
  dark: boolean; onToggleTheme: () => void; onBack: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ItemInfo | null>(null);

  const items = Object.values(itemsInfo)
    .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="pb-24">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full shrink-0">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-2xl font-bold flex-1">Oggetti</h1>
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
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
                  ? <img src={item.icon} alt={item.name} className="max-w-[85%] max-h-[85%] object-contain" />
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

// --- MAIN APP ---

type Tab = 'stash' | 'rifugio' | 'settings' | 'items';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stash');
  const [returnTab, setReturnTab] = useState<Tab>('stash');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(() =>
    safeLS(() => {
      const raw = localStorage.getItem('stash-sort');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.key) return { key: parsed.key as SortKey, dir: (parsed.dir === -1 ? -1 : 1) as SortDir };
      }
      return { key: 'priority' as SortKey, dir: 1 as SortDir };
    }, { key: 'priority' as SortKey, dir: 1 as SortDir })
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { dark, toggle: toggleTheme } = useTheme();
  const store = useAppStore();

  useEffect(() => {
    safeLS(() => localStorage.setItem('stash-sort', JSON.stringify(sort)), undefined);
  }, [sort]);

  const handleSortClick = (key: SortKey) =>
    setSort(s => s.key === key ? { key, dir: (s.dir * -1) as SortDir } : { key, dir: 1 });

  // Workbenches sorted by user priority
  const orderedWorkbenches = [...store.workbenches].sort((a, b) => {
    const oa = store.workbenchOrder.indexOf(a.id);
    const ob = store.workbenchOrder.indexOf(b.id);
    return (oa === -1 ? 999 : oa) - (ob === -1 ? 999 : ob);
  });

  const missingMaterials = store.getMissingMaterials();
  const availableUpgrades = store.getAvailableUpgrades();
  const refinerLevel = store.hideoutLevels['refiner'] ?? 0;

  // Priority sort: each item gets the index of the highest-priority workbench that needs it
  const itemPriorityIndex = (itemId: string): number => {
    for (let i = 0; i < orderedWorkbenches.length; i++) {
      const wb = orderedWorkbenches[i];
      if (!store.activeModules[wb.id]) continue;
      const current = store.hideoutLevels[wb.id] ?? 0;
      const target = store.targetLevels[wb.id] ?? wb.maxLevel;
      const needed = wb.levels.some(lvl =>
        lvl.level > current && lvl.level <= target &&
        lvl.requirementItemIds.some(r => r.itemId === itemId)
      );
      if (needed) return i;
    }
    return 999;
  };

  const sortedMaterials = [...missingMaterials].sort((a, b) => {
    let cmp = 0;
    if (sort.key === 'priority') cmp = itemPriorityIndex(a.itemId) - itemPriorityIndex(b.itemId);
    else if (sort.key === 'name') cmp = (store.itemsInfo[a.itemId]?.name ?? a.itemId).localeCompare(store.itemsInfo[b.itemId]?.name ?? b.itemId);
    else if (sort.key === 'rarity') {
      const ra = rarityOrder[store.itemsInfo[a.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
      const rb = rarityOrder[store.itemsInfo[b.itemId]?.rarity?.toLowerCase() ?? ''] ?? -1;
      cmp = rb - ra;
    }
    else if (sort.key === 'type') cmp = (store.itemsInfo[a.itemId]?.item_type ?? '').localeCompare(store.itemsInfo[b.itemId]?.item_type ?? '');
    return cmp * sort.dir;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = store.workbenchOrder.indexOf(active.id as string);
    const newIndex = store.workbenchOrder.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1)
      store.setWorkbenchOrder(arrayMove(store.workbenchOrder, oldIndex, newIndex));
  };

  const activeWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) < wb.maxLevel);
  const maxedWBs = orderedWorkbenches.filter(wb => (store.hideoutLevels[wb.id] ?? 0) >= wb.maxLevel);

  // Hidden section (not in bottom nav) — will become the "Database" hub later
  const openItems = () => { setReturnTab(activeTab); setActiveTab('items'); };
  const databaseButton = (
    <button onClick={openItems} title="Database oggetti"
      className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full transition-colors shrink-0">
      <Database size={14} className="text-gray-500" />
    </button>
  );

  const sortLabels: Record<SortKey, string> = { priority: 'Priorità', name: 'A→Z', rarity: 'Rarità', type: 'Tipo' };

  const renderTab = () => {
    switch (activeTab) {
      case 'stash':
        return (
          <div className="pb-24">
            <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
              <div className="mb-3">
                <SectionHeader title="Stash" dark={dark} onToggleTheme={toggleTheme}
                  actions={<>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={store.filterHideCompleted}
                        onChange={e => store.setFilterHideCompleted(e.target.checked)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                      Nascondi completati
                    </label>
                    {databaseButton}
                  </>}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {(Object.keys(sortLabels) as SortKey[]).map(key => {
                  const isSelected = sort.key === key;
                  return (
                    <button key={key} onClick={() => handleSortClick(key)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {sortLabels[key]}
                      {isSelected && (sort.dir === 1 ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sortedMaterials
                .filter(m => !store.filterHideCompleted || !m.isCompleted)
                .map(mat => (
                  <InventoryCard key={mat.itemId} {...mat}
                    itemInfo={store.itemsInfo[mat.itemId]}
                    refinerLevel={refinerLevel}
                    onIncrement={() => store.incrementItem(mat.itemId)}
                    onDecrement={() => store.decrementItem(mat.itemId)}
                    onSet={val => store.setItemCount(mat.itemId, val)}
                  />
                ))}
            </div>
            {missingMaterials.length === 0 && (
              <div className="p-20 text-center text-gray-500 italic text-sm">
                Nessun materiale richiesto per gli obiettivi attuali.
              </div>
            )}
          </div>
        );

      case 'rifugio':
        return (
          <div className="p-4 pb-24">
            <div className="mb-4">
              <SectionHeader title="Rifugio" dark={dark} onToggleTheme={toggleTheme} actions={databaseButton} />
            </div>
            {activeWBs.map(wb => (
              <WorkbenchCard key={wb.id} wb={wb}
                currentLevel={store.hideoutLevels[wb.id] ?? 0}
                itemsInfo={store.itemsInfo}
                refinerLevel={refinerLevel}
                canUpgrade={availableUpgrades.includes(wb.id)}
                onUpgrade={() => store.upgradeModule(wb.id)}
              />
            ))}
            {maxedWBs.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-4 mb-2 px-1">Completati</p>
                {maxedWBs.map(wb => (
                  <WorkbenchCard key={wb.id} wb={wb}
                    currentLevel={store.hideoutLevels[wb.id] ?? 0}
                    itemsInfo={store.itemsInfo}
                    refinerLevel={refinerLevel}
                    canUpgrade={false}
                    onUpgrade={() => {}}
                  />
                ))}
              </>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="p-4 pb-24">
            <div className="mb-4">
              <SectionHeader title="Obiettivi" dark={dark} onToggleTheme={toggleTheme}
                actions={<>{databaseButton}{showResetConfirm ? (
                  <div className="flex gap-2">
                    <button onClick={() => { store.resetProgress(); setShowResetConfirm(false); }}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      Conferma
                    </button>
                    <button onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">
                      Annulla
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-full">
                    <RotateCcw size={13} />
                    Ripristina
                  </button>
                )}</>}
              />
            </div>
            <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
              <GripVertical size={13} />
              Trascina per cambiare la priorità di visualizzazione
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={store.workbenchOrder} strategy={verticalListSortingStrategy}>
                {orderedWorkbenches.map(wb => (
                  <SortableWorkbenchRow key={wb.id} wb={wb}
                    current={store.hideoutLevels[wb.id] ?? 0}
                    target={store.targetLevels[wb.id] ?? wb.maxLevel}
                    isActive={store.activeModules[wb.id]}
                    onToggle={() => store.toggleModuleActive(wb.id)}
                    onCurrentLevel={v => store.setModuleCurrentLevel(wb.id, v)}
                    onTargetLevel={v => store.setModuleTargetLevel(wb.id, v)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        );

      case 'items':
        return (
          <ItemsPage itemsInfo={store.itemsInfo} refinerLevel={refinerLevel}
            dark={dark} onToggleTheme={toggleTheme}
            onBack={() => setActiveTab(returnTab)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      <main className="max-w-md mx-auto min-h-screen">
        {renderTab()}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 pb-safe">
        <div className="max-w-md mx-auto flex">
          <TabButton active={activeTab === 'stash'} onClick={() => setActiveTab('stash')} icon={Backpack} label="Stash" />
          <TabButton active={activeTab === 'rifugio'} onClick={() => setActiveTab('rifugio')} icon={Home} label="Rifugio" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={SettingsIcon} label="Obiettivi" />
        </div>
      </nav>
    </div>
  );
}
