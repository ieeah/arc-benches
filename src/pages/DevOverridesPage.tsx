import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Search, Download, Copy, Check, Sparkles,
  Trash2, RotateCcw, FileJson, Monitor, Edit3, Globe,
  Plus, EyeOff
} from 'lucide-react';
import type { ItemInfo, ItemTranslation } from '@/types';
import { useAppStore } from '@/store';
import { IconButton } from '@/components/IconButton';
import { ItemCardFrame } from '@/components/ItemCardFrame';
import itemsDataBase from '@/data/items.json';
import initialOverrides from '@/data/items-overrides.json';
import { getRarityText } from '@/lib/rarity';

type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
const RARITIES: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const AVAILABLE_LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

const SUGGESTED_ITEM_TYPES = [
  'Basic Material', 'Topside Material', 'Refined Material', 'Advanced Material',
  'Weapon', 'Modification', 'Quick Use', 'Consumable', 'Throwable', 'Gadget',
  'Augment', 'Shield', 'Trinket', 'Key', 'Recyclable', 'Nature', 'Misc'
];

const SUGGESTED_WORKBENCHES = [
  'Refiner', 'Gunsmith', 'Weapon Bench', 'Med Station', 'Medical Lab',
  'Utility Bench', 'Explosives Bench', 'Gear Bench', 'Equipment Bench'
];

const SUGGESTED_LOOT_AREAS = [
  'ARC', 'Commercial', 'Electrical', 'Exodus', 'Industrial',
  'Mechanical', 'Medical', 'Nature', 'Old World', 'Residential',
  'Security', 'Technological'
];

export interface ItemOverrideData {
  name?: string; // Default (English) override if different from MetaForge
  description?: string; // Default (English) override
  translations?: Record<string, ItemTranslation>; // e.g. { it: { name: "...", description: "..." } }
  rarity?: ItemRarity;
  item_type?: string;
  subcategory?: string | null;
  value?: number;
  workbench?: string | null;
  loot_area?: string | null;
  stack_size?: number | null;
  hidden?: boolean;
}

type ItemOverrideMap = Record<string, ItemOverrideData>;

export const DevOverridesPage = ({ onBack }: { onBack: () => void }) => {
  const store = useAppStore();
  const allItems = useMemo(() => Object.values(itemsDataBase as Record<string, ItemInfo>), []);

  // Stato degli overrides locali in memoria
  const [overrides, setOverrides] = useState<ItemOverrideMap>(() => {
    try {
      const saved = localStorage.getItem('dev_items_overrides_draft');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return (initialOverrides as ItemOverrideMap) || {};
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyOverridden, setFilterOnlyOverridden] = useState(false);
  const [filterOnlyHidden, setFilterOnlyHidden] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>(allItems[0]?.id || 'metal-parts');
  const [selectedLang, setSelectedLang] = useState<string>('it');
  const [customLangCode, setCustomLangCode] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Salva bozza in localStorage e sincronizza istantaneamente lo store Zustand dell'intera app
  useEffect(() => {
    try {
      localStorage.setItem('dev_items_overrides_draft', JSON.stringify(overrides));
      store.syncItemsOverrides?.();
    } catch { /* ignore */ }
  }, [overrides, store]);

  const selectedItemBase = useMemo(() => {
    return (itemsDataBase as Record<string, ItemInfo>)[selectedItemId] || allItems[0];
  }, [selectedItemId, allItems]);

  const currentItemOverride = useMemo(() => {
    return overrides[selectedItemId] || {};
  }, [overrides, selectedItemId]);

  // Item calcolato con override attivi
  const selectedItemEffective: ItemInfo = useMemo(() => {
    if (!selectedItemBase) return allItems[0];
    return {
      ...selectedItemBase,
      ...currentItemOverride,
    };
  }, [selectedItemBase, currentItemOverride, allItems]);

  // Lista oggetti filtrata per la sidebar sinistra
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (filterOnlyOverridden) {
      list = list.filter(item => Boolean(overrides[item.id] && Object.keys(overrides[item.id]).length > 0));
    }
    if (filterOnlyHidden) {
      list = list.filter(item => Boolean(overrides[item.id]?.hidden));
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.item_type?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, searchQuery, filterOnlyOverridden, filterOnlyHidden, overrides]);

  const totalOverriddenItems = useMemo(() => {
    return Object.values(overrides).filter(o => o && Object.keys(o).length > 0).length;
  }, [overrides]);

  const totalHiddenItems = useMemo(() => {
    return Object.values(overrides).filter(o => o?.hidden).length;
  }, [overrides]);

  // Modifica di un campo generico (mantiene il valore digitato anche se stringa vuota)
  const handleFieldChange = <K extends keyof ItemOverrideData>(field: K, value: ItemOverrideData[K] | undefined) => {
    setOverrides(prev => {
      const updated = { ...prev };
      const current = { ...(updated[selectedItemId] || {}) };

      if (value === undefined) {
        delete current[field];
      } else {
        current[field] = value;
      }

      if (Object.keys(current).length === 0) {
        delete updated[selectedItemId];
      } else {
        updated[selectedItemId] = current;
      }
      return updated;
    });
  };

  // Modifica di un campo di traduzione (per lingua selezionata)
  const handleTranslationChange = (
    lang: string,
    field: keyof ItemTranslation,
    value: string
  ) => {
    setOverrides(prev => {
      const updated = { ...prev };
      const current = { ...(updated[selectedItemId] || {}) };
      const currentTranslations = { ...(current.translations || {}) };
      const langEntry = { ...(currentTranslations[lang] || {}) };

      if (value === '') {
        delete langEntry[field];
      } else {
        langEntry[field] = value;
      }

      if (Object.keys(langEntry).length === 0) {
        delete currentTranslations[lang];
      } else {
        currentTranslations[lang] = langEntry;
      }

      if (Object.keys(currentTranslations).length === 0) {
        delete current.translations;
      } else {
        current.translations = currentTranslations;
      }

      if (Object.keys(current).length === 0) {
        delete updated[selectedItemId];
      } else {
        updated[selectedItemId] = current;
      }
      return updated;
    });
  };

  const handleClearLanguageTranslation = (lang: string) => {
    setOverrides(prev => {
      const updated = { ...prev };
      const current = { ...(updated[selectedItemId] || {}) };
      if (!current.translations || !current.translations[lang]) return prev;

      const currentTranslations = { ...current.translations };
      delete currentTranslations[lang];

      if (Object.keys(currentTranslations).length === 0) {
        delete current.translations;
      } else {
        current.translations = currentTranslations;
      }

      if (Object.keys(current).length === 0) {
        delete updated[selectedItemId];
      } else {
        updated[selectedItemId] = current;
      }
      return updated;
    });
  };

  const handleResetItemOverrides = (itemId: string) => {
    setOverrides(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleResetAllOverrides = () => {
    if (confirm('Sei sicuro di voler ripristinare tutti gli override allo stato iniziale di items-overrides.json?')) {
      setOverrides((initialOverrides as ItemOverrideMap) || {});
      localStorage.removeItem('dev_items_overrides_draft');
    }
  };

  const jsonString = useMemo(() => {
    return JSON.stringify(overrides, null, 2);
  }, [overrides]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      alert('Impossibile copiare negli appunti');
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lingue attive per l'oggetto selezionato
  const activeLangsForItem = useMemo(() => {
    if (!currentItemOverride.translations) return [];
    return Object.keys(currentItemOverride.translations);
  }, [currentItemOverride]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col">
      {/* ── AVVISO PER SCHERMI PICCOLI (DESKTOP ONLY REQUIREMENT) ── */}
      <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/95 text-white flex flex-col items-center justify-center p-6 text-center">
        <Monitor size={48} className="text-amber-400 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Dashboard Solo per Desktop</h2>
        <p className="text-sm text-gray-300 max-w-sm mb-6">
          La gestione e modifica degli Overrides di gioco è uno strumento per sviluppatori ottimizzato esclusivamente per schermi Desktop (risoluzione &ge; 1024px).
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-bold text-sm rounded-2xl flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} /> Torna all'App
        </button>
      </div>

      {/* ── HEADER SUPERIORE ── */}
      <header className="shrink-0 px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <IconButton onClick={onBack} title="Torna all'App">
            <ArrowLeft size={18} />
          </IconButton>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <FileJson size={18} className="text-blue-500" />
                MetaForge Overrides Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Dev Only
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Modifica, dichiara ed esporta gli overrides locali per <code className="text-blue-500 font-mono">src/data/items-overrides.json</code>
            </p>
          </div>
        </div>

        {/* Toolbar Azioni Globali */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>{totalOverriddenItems} Override</span>
          </div>

          {totalHiddenItems > 0 && (
            <div className="px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
              <EyeOff size={13} />
              <span>{totalHiddenItems} Nascosti</span>
            </div>
          )}

          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copyFeedback ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copyFeedback ? 'Copiato!' : 'Copia JSON'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Scarica JSON</span>
          </button>

          <button
            onClick={handleResetAllOverrides}
            className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            title="Ripristina file iniziale"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </header>

      {/* ── LAYOUT A 3 COLONNE (DESKTOP) ── */}
      <main className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
        {/* COLONNA 1: LISTA OGGETTI (3 / 12) - ALTEZZA FISSA CON SCROLLBAR */}
        <aside className="col-span-3 h-full overflow-hidden border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
          <div className="shrink-0 p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cerca per nome o ID…"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterOnlyOverridden}
                  onChange={e => setFilterOnlyOverridden(e.target.checked)}
                  className="rounded text-blue-500"
                />
                <span>Solo override</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-red-500 dark:text-red-400">
                <input
                  type="checkbox"
                  checked={filterOnlyHidden}
                  onChange={e => setFilterOnlyHidden(e.target.checked)}
                  className="rounded text-red-500"
                />
                <span>Solo nascosti ({totalHiddenItems})</span>
              </label>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredItems.map(item => {
              const isSelected = item.id === selectedItemId;
              const hasOverride = Boolean(overrides[item.id] && Object.keys(overrides[item.id]).length > 0);
              const isHidden = Boolean(overrides[item.id]?.hidden);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-xs'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <ItemCardFrame
                    icon={item.icon}
                    alt={item.name}
                    rarity={overrides[item.id]?.rarity || item.rarity}
                    fallbackText={item.id}
                    className={`w-11 h-11 shrink-0 rounded-xl shadow-2xs ${isHidden ? 'opacity-40 grayscale' : ''}`}
                    imgClassName="max-w-[88%] max-h-[88%] object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      isHidden ? 'text-gray-400 line-through' : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {overrides[item.id]?.name || item.name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate font-mono mt-0.5">{item.id}</p>
                  </div>
                  {isHidden ? (
                    <span title="Nascosto dall'app" className="shrink-0">
                      <EyeOff size={13} className="text-red-500" />
                    </span>
                  ) : hasOverride ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Override attivo" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        {/* COLONNA 2: EDITOR OVERRIDE OGGETTO (6 / 12) */}
        <section className="col-span-6 h-full overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/50 p-6 space-y-6">
          {selectedItemBase ? (
            <>
              {/* Scheda di Anteprima Live */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ItemCardFrame
                    icon={selectedItemEffective.icon}
                    alt={selectedItemEffective.name}
                    rarity={selectedItemEffective.rarity}
                    fallbackText={selectedItemEffective.id}
                    className={`w-16 h-16 shrink-0 ${currentItemOverride.hidden ? 'opacity-40 grayscale' : ''}`}
                    imgClassName="max-w-[85%] max-h-[85%] object-contain"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base font-black ${
                        currentItemOverride.hidden ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                      }`}>
                        {selectedItemEffective.name}
                      </h2>
                      <span className={`text-xs font-bold ${getRarityText(selectedItemEffective.rarity)}`}>
                        {selectedItemEffective.rarity}
                      </span>
                      {currentItemOverride.hidden && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center gap-1">
                          <EyeOff size={11} /> Nascosto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{selectedItemEffective.id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedItemEffective.item_type} {selectedItemEffective.subcategory ? `· ${selectedItemEffective.subcategory}` : ''}
                      {selectedItemEffective.workbench ? ` · 🔨 ${selectedItemEffective.workbench}` : ''}
                      {selectedItemEffective.value ? ` · 🪙 ${selectedItemEffective.value}` : ''}
                    </p>
                  </div>
                </div>

                {overrides[selectedItemId] && (
                  <button
                    onClick={() => handleResetItemOverrides(selectedItemId)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Rimuovi Overrides</span>
                  </button>
                )}
              </div>

              {/* Form di Modifica Campi Generali (Inglese / Base) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Edit3 size={14} className="text-blue-500" /> Campi Base (Default / Inglese)
                  </h3>
                  <span className="text-[11px] text-gray-400">Valori base di gioco da MetaForge</span>
                </div>

                {/* Switch Visibilità (Hidden) */}
                <div className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl border transition-all ${
                  currentItemOverride.hidden
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-700/60'
                }`}>
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <EyeOff size={14} className={currentItemOverride.hidden ? 'text-red-500' : 'text-gray-400'} />
                    Visibilità
                  </label>
                  <div className="col-span-9 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(currentItemOverride.hidden)}
                        onChange={e => handleFieldChange('hidden', e.target.checked ? true : undefined)}
                        className="w-4 h-4 rounded text-red-500 focus:ring-red-400 cursor-pointer"
                      />
                      <span>Nascondi oggetto (escludi completamente dall'app)</span>
                    </label>
                    {currentItemOverride.hidden && (
                      <span className="text-[10px] font-mono text-red-500 font-bold">
                        hidden: true
                      </span>
                    )}
                  </div>
                </div>

                {/* Nome Base */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Nome (Default)</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="text"
                      value={currentItemOverride.name !== undefined ? currentItemOverride.name : selectedItemBase.name}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      placeholder={selectedItemBase.name}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.name !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {currentItemOverride.name !== undefined && (
                      <button
                        onClick={() => handleFieldChange('name', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Rarità */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Rarità</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <select
                      value={currentItemOverride.rarity !== undefined ? currentItemOverride.rarity : selectedItemBase.rarity}
                      onChange={e => handleFieldChange('rarity', e.target.value as ItemRarity)}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.rarity !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {RARITIES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {currentItemOverride.rarity !== undefined && (
                      <button
                        onClick={() => handleFieldChange('rarity', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Tipo Oggetto */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Tipo Oggetto</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="text"
                      list="suggested-types"
                      value={currentItemOverride.item_type !== undefined ? currentItemOverride.item_type : selectedItemBase.item_type}
                      onChange={e => handleFieldChange('item_type', e.target.value)}
                      placeholder={selectedItemBase.item_type}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.item_type !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    <datalist id="suggested-types">
                      {SUGGESTED_ITEM_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                    {currentItemOverride.item_type !== undefined && (
                      <button
                        onClick={() => handleFieldChange('item_type', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Sottocategoria */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Sottocategoria</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="text"
                      value={currentItemOverride.subcategory !== undefined ? (currentItemOverride.subcategory || '') : (selectedItemBase.subcategory || '')}
                      onChange={e => handleFieldChange('subcategory', e.target.value || null)}
                      placeholder={selectedItemBase.subcategory || 'Nessuna'}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.subcategory !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {currentItemOverride.subcategory !== undefined && (
                      <button
                        onClick={() => handleFieldChange('subcategory', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Valore (Prezzo) */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Valore (Monete)</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="number"
                      value={currentItemOverride.value !== undefined ? currentItemOverride.value : selectedItemBase.value}
                      onChange={e => handleFieldChange('value', e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                      placeholder={String(selectedItemBase.value)}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.value !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {currentItemOverride.value !== undefined && (
                      <button
                        onClick={() => handleFieldChange('value', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Banco di Crafting */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Banco da Lavoro</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="text"
                      list="suggested-workbenches"
                      value={currentItemOverride.workbench !== undefined ? (currentItemOverride.workbench || '') : (selectedItemBase.workbench || '')}
                      onChange={e => handleFieldChange('workbench', e.target.value || null)}
                      placeholder={selectedItemBase.workbench || 'Nessuno'}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.workbench !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    <datalist id="suggested-workbenches">
                      {SUGGESTED_WORKBENCHES.map(wb => <option key={wb} value={wb} />)}
                    </datalist>
                    {currentItemOverride.workbench !== undefined && (
                      <button
                        onClick={() => handleFieldChange('workbench', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Area di Loot */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Area di Loot</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="text"
                      list="suggested-loot-areas"
                      value={currentItemOverride.loot_area !== undefined ? (currentItemOverride.loot_area || '') : (selectedItemBase.loot_area || '')}
                      onChange={e => handleFieldChange('loot_area', e.target.value || null)}
                      placeholder={selectedItemBase.loot_area || 'Nessuna'}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.loot_area !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    <datalist id="suggested-loot-areas">
                      {SUGGESTED_LOOT_AREAS.map(la => <option key={la} value={la} />)}
                    </datalist>
                    {currentItemOverride.loot_area !== undefined && (
                      <button
                        onClick={() => handleFieldChange('loot_area', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Stack Size */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">Dimensione Stack</label>
                  <div className="col-span-9 flex items-center gap-2">
                    <input
                      type="number"
                      value={currentItemOverride.stack_size !== undefined ? (currentItemOverride.stack_size || '') : (selectedItemBase.stack_size || '')}
                      onChange={e => handleFieldChange('stack_size', e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder={selectedItemBase.stack_size ? String(selectedItemBase.stack_size) : 'Nessuno'}
                      className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium ${
                        currentItemOverride.stack_size !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    />
                    {currentItemOverride.stack_size !== undefined && (
                      <button
                        onClick={() => handleFieldChange('stack_size', undefined)}
                        className="text-xs text-gray-400 hover:text-red-500 px-1"
                        title="Ripristina default"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Descrizione Base */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Descrizione (Default / Inglese)</label>
                    {currentItemOverride.description !== undefined && (
                      <button
                        onClick={() => handleFieldChange('description', undefined)}
                        className="text-[11px] text-gray-400 hover:text-red-500"
                      >
                        Ripristina default
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={currentItemOverride.description !== undefined ? currentItemOverride.description : selectedItemBase.description}
                    onChange={e => handleFieldChange('description', e.target.value)}
                    placeholder={selectedItemBase.description}
                    className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed ${
                      currentItemOverride.description !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  />
                </div>
              </div>

              {/* ── SEZIONE TRADUZIONI & LOCALIZZAZIONE MULTILINGUA ── */}
              <div className="bg-white dark:bg-gray-900 border border-purple-200/70 dark:border-purple-900/50 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-purple-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      Traduzioni & Multilingua (Localizzazione)
                    </h3>
                  </div>
                  {activeLangsForItem.length > 0 && (
                    <div className="flex items-center gap-1">
                      {activeLangsForItem.map(l => (
                        <span key={l} className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-[10px] font-bold text-purple-700 dark:text-purple-300 font-mono uppercase">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selettore Lingua per Editing */}
                <div className="flex items-center gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                  <label className="text-xs font-bold text-purple-900 dark:text-purple-300 shrink-0">
                    Lingua di Traduzione:
                  </label>

                  <select
                    value={selectedLang}
                    onChange={e => setSelectedLang(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                  >
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label} ({lang.code})
                      </option>
                    ))}
                    {customLangCode && !AVAILABLE_LANGUAGES.some(l => l.code === customLangCode) && (
                      <option value={customLangCode}>🌐 Custom ({customLangCode})</option>
                    )}
                  </select>

                  {/* Input codice lingua personalizzato */}
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="es. zh-TW"
                      value={customLangCode}
                      onChange={e => setCustomLangCode(e.target.value.trim().toLowerCase())}
                      className="w-20 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl text-center font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customLangCode) setSelectedLang(customLangCode);
                      }}
                      className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      title="Usa codice personalizzato"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Form Traduzione per la Lingua Selezionata */}
                <div className="space-y-4 pt-2">
                  {/* Nome Tradotto */}
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <label className="col-span-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                      Nome ({selectedLang.toUpperCase()})
                    </label>
                    <div className="col-span-9 flex items-center gap-2">
                      <input
                        type="text"
                        value={currentItemOverride.translations?.[selectedLang]?.name || ''}
                        onChange={e => handleTranslationChange(selectedLang, 'name', e.target.value)}
                        placeholder={`Traduzione nome in ${selectedLang} (Default: ${selectedItemEffective.name})`}
                        className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                      />
                      {currentItemOverride.translations?.[selectedLang]?.name && (
                        <button
                          onClick={() => handleTranslationChange(selectedLang, 'name', '')}
                          className="text-xs text-gray-400 hover:text-red-500 px-1"
                          title="Cancella traduzione nome"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Descrizione Tradotta */}
                  <div className="space-y-1.5 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Descrizione ({selectedLang.toUpperCase()})
                      </label>
                      {currentItemOverride.translations?.[selectedLang]?.description && (
                        <button
                          onClick={() => handleTranslationChange(selectedLang, 'description', '')}
                          className="text-[11px] text-gray-400 hover:text-red-500"
                        >
                          Cancella traduzione descrizione
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={currentItemOverride.translations?.[selectedLang]?.description || ''}
                      onChange={e => handleTranslationChange(selectedLang, 'description', e.target.value)}
                      placeholder={`Traduzione descrizione in ${selectedLang} (Default: ${selectedItemEffective.description})`}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium leading-relaxed"
                    />
                  </div>

                  {/* Azione elimina traduzione lingua corrente */}
                  {currentItemOverride.translations?.[selectedLang] && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleClearLanguageTranslation(selectedLang)}
                        className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Rimuovi traduzione per lingua {selectedLang.toUpperCase()}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Seleziona un oggetto dalla colonna di sinistra
            </div>
          )}
        </section>

        {/* COLONNA 3: JSON LIVE PREVIEW (3 / 12) - ALTEZZA FISSA */}
        <aside className="col-span-3 h-full overflow-hidden flex flex-col bg-gray-900 text-gray-300">
          <div className="shrink-0 p-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-gray-400 flex items-center gap-1.5">
              <FileJson size={14} className="text-blue-400" />
              items-overrides.json
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {totalOverriddenItems} chiavi
            </span>
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 select-all">
            <pre>{jsonString}</pre>
          </div>
        </aside>
      </main>
    </div>
  );
};
