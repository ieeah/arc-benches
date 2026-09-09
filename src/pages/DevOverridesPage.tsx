import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Search, Download, Copy, Check, Sparkles,
  Trash2, RotateCcw, FileJson, Edit3, Globe,
  EyeOff, ChevronDown
} from 'lucide-react';
import type { ItemInfo, ItemTranslation } from '@/types';
import { useAppStore } from '@/store';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import itemsDataBase from '@/data/items.json';
import initialOverrides from '@/data/items-overrides.json';
import { getRarityText } from '@/lib/rarity';
import { SUPPORTED_LANGUAGES, getItemSearchFields } from '@/i18n';
import { fuzzyMatch } from '@/lib/fuzzy';

type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
const RARITIES: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

// Stato + wiring (click esterno, Escape) per un menu a comparsa custom, usato dalle
// select con icona di "Tipo Oggetto" e "Sottocategoria" (un <select> nativo non può
// mostrare icone nelle opzioni). Il ref del contenitore resta un useRef separato nel
// componente chiamante: restituirlo insieme allo stato dall'hook fa sì che il linter
// (react-hooks/refs) tratti per prudenza l'intero oggetto come un ref.
function useDropdownMenu(ref: React.RefObject<HTMLDivElement | null>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, ref]);

  return { open, setOpen };
}

const AVAILABLE_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.code !== 'en');

// Tipi oggetto e sottocategorie derivati dal catalogo EFFETTIVO (items.json + le
// correzioni già presenti in items-overrides.json), non dal solo dato grezzo MetaForge:
// per il dominio "Quick Use" (Healing/Utility/Gadget/Grenade/Trap) item_type e subcategory
// sono quasi sempre appiattiti su "Quick Use" dallo scraping, e la classificazione reale
// (icone comprese, vedi src/lib/categoryIcons.ts) sopravvive solo nelle correzioni curate.
// Derivare le opzioni dal catalogo effettivo fa sì che quelle correzioni compaiano come
// valori selezionabili anche per gli item non ancora corretti nello stesso tipo.
const itemsRecord = itemsDataBase as Record<string, ItemInfo>;
const overridesRecord = initialOverrides as Record<string, Partial<ItemOverrideData>>;
const effectiveBaseItems: ItemInfo[] = Object.entries(itemsRecord).map(([id, item]) => ({
  ...item,
  ...overridesRecord[id],
}));

const ITEM_TYPES: string[] = Array.from(
  new Set(
    effectiveBaseItems
      .map(i => i.item_type?.trim())
      .filter((t): t is string => Boolean(t))
  )
).sort((a, b) => a.localeCompare(b));

const ITEM_TYPE_SUBCATEGORIES: Record<string, string[]> = {};
for (const item of effectiveBaseItems) {
  const type = item.item_type?.trim();
  const sub = item.subcategory?.trim();
  if (!type || !sub) continue;
  const list = ITEM_TYPE_SUBCATEGORIES[type] || (ITEM_TYPE_SUBCATEGORIES[type] = []);
  if (!list.includes(sub)) list.push(sub);
}
for (const list of Object.values(ITEM_TYPE_SUBCATEGORIES)) {
  list.sort((a, b) => a.localeCompare(b));
}

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

interface SidebarItemRowProps {
  item: ItemInfo;
  isSelected: boolean;
  hasOverride: boolean;
  isHidden: boolean;
  overrideName?: string;
  overrideRarity?: string;
  onSelect: (id: string) => void;
}

const SidebarItemRow = React.memo(({
  item,
  isSelected,
  hasOverride,
  isHidden,
  overrideName,
  overrideRarity,
  onSelect,
}: SidebarItemRowProps) => {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-xs'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
      }`}
    >
      <ItemCardFrameV2
        icon={item.icon}
        alt={item.name}
        rarity={overrideRarity || item.rarity}
        fallbackText={item.id}
        className={`w-11 h-11 shrink-0 rounded-xl shadow-2xs ${isHidden ? 'opacity-40 grayscale' : ''}`}
        imgClassName="max-w-[88%] max-h-[88%] object-contain"
        compact
      />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${
          isHidden ? 'text-gray-400 line-through' : isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
        }`}>
          {overrideName || item.name}
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
});

export const DevOverridesPage = ({
  onBack,
  initialSelectedItemId,
}: {
  onBack: () => void;
  initialSelectedItemId?: string | null;
}) => {
  const syncItemsOverrides = useAppStore(s => s.syncItemsOverrides);
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
  const [filterMissingName, setFilterMissingName] = useState(false);
  const [filterMissingDesc, setFilterMissingDesc] = useState(false);
  const [filterMissingBoth, setFilterMissingBoth] = useState(false);
  const [filterTranslationLang, setFilterTranslationLang] = useState<string>('it');
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialSelectedItemId && (itemsDataBase as Record<string, ItemInfo>)[initialSelectedItemId]
      ? initialSelectedItemId
      : allItems[0]?.id || ''
  );
  const [selectedLang, setSelectedLang] = useState<string>('it');
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title?: string;
    message: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (initialSelectedItemId && (itemsDataBase as Record<string, ItemInfo>)[initialSelectedItemId]) {
      setSelectedItemId(initialSelectedItemId);
    }
  }, [initialSelectedItemId]);

  // Serializzazione JSON non bloccante tramite concurrent rendering di React 19
  const deferredOverrides = React.useDeferredValue(overrides);
  const jsonString = useMemo(() => JSON.stringify(deferredOverrides, null, 2), [deferredOverrides]);

  // Salva bozza in localStorage e sincronizza lo store Zustand con debounce per evitare lag durante la digitazione
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('dev_items_overrides_draft', JSON.stringify(overrides));
      } catch (err) {
        console.warn('Errore salvataggio bozza overrides:', err);
      }
      try {
        syncItemsOverrides?.();
      } catch (err) {
        console.warn('Errore sync overrides store:', err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [overrides, syncItemsOverrides]);

  const selectedItemBase = useMemo(() => {
    return (itemsDataBase as Record<string, ItemInfo>)[selectedItemId] || allItems[0];
  }, [selectedItemId, allItems]);

  const currentItemOverride = useMemo(() => {
    return overrides[selectedItemId] || {};
  }, [overrides, selectedItemId]);

  const activeItemType = currentItemOverride.item_type !== undefined ? currentItemOverride.item_type : selectedItemBase.item_type;
  const activeSubcategory = currentItemOverride.subcategory !== undefined ? currentItemOverride.subcategory : selectedItemBase.subcategory;

  // Elenco tipi oggetto per la select: valori reali da items.json, più il valore
  // attivo se per qualche motivo non fosse già incluso (dato legacy/anomalo).
  const itemTypeOptions = useMemo(() => {
    const set = new Set(ITEM_TYPES);
    if (activeItemType) set.add(activeItemType);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeItemType]);

  // Dropdown custom per "Tipo Oggetto" e "Sottocategoria": un <select> nativo non
  // può mostrare icone nelle opzioni, quindi usiamo un menu a comparsa con CategoryBadge.
  // L'icona finale dipende dalla sottocategoria quando è una delle 6 riconosciute
  // (Healing/Utility/Gadget/Grenade/Trap/Key, vedi src/lib/categoryIcons.ts), quindi
  // entrambe le select mostrano l'icona effettiva risultante, non solo quella del tipo.
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const typeMenu = useDropdownMenu(typeMenuRef);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const subMenu = useDropdownMenu(subMenuRef);

  // Sottocategorie pertinenti al tipo oggetto attivo (dinamiche), più il valore
  // attivo se non presente nella lista derivata.
  const subcategoryOptions = useMemo(() => {
    const list = (activeItemType && ITEM_TYPE_SUBCATEGORIES[activeItemType]) || [];
    const set = new Set(list);
    if (activeSubcategory) set.add(activeSubcategory);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeItemType, activeSubcategory]);

  // Cambiare item chiude comunque i menu a comparsa: la riga selezionata nella
  // sidebar è fuori da typeMenuRef/subMenuRef, quindi il click-outside dell'hook
  // se ne occupa già senza bisogno di deps instabili qui.
  const handleSelect = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  // Item calcolato con override attivi
  const selectedItemEffective: ItemInfo = useMemo(() => {
    if (!selectedItemBase) return allItems[0];
    return {
      ...selectedItemBase,
      ...currentItemOverride,
    };
  }, [selectedItemBase, currentItemOverride, allItems]);

  const getItemTranslationStatus = useCallback((item: ItemInfo, lang: string) => {
    const overrideTrans = overrides[item.id]?.translations?.[lang];
    const baseTrans = item.translations?.[lang];
    const effectiveName = overrideTrans?.name !== undefined ? overrideTrans.name : baseTrans?.name;
    const effectiveDesc = overrideTrans?.description !== undefined ? overrideTrans.description : baseTrans?.description;
    const hasName = Boolean(effectiveName && effectiveName.trim() !== '');
    const hasDesc = Boolean(effectiveDesc && effectiveDesc.trim() !== '');
    return {
      hasName,
      hasDesc,
      missingName: !hasName,
      missingDesc: !hasDesc,
      missingBoth: !hasName && !hasDesc,
    };
  }, [overrides]);

  // Lista oggetti filtrata per la sidebar sinistra
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (filterOnlyOverridden) {
      list = list.filter(item => Boolean(overrides[item.id] && Object.keys(overrides[item.id]).length > 0));
    }
    if (filterOnlyHidden) {
      list = list.filter(item => Boolean(overrides[item.id]?.hidden));
    }
    if (filterMissingBoth || filterMissingName || filterMissingDesc) {
      list = list.filter(item => {
        const st = getItemTranslationStatus(item, filterTranslationLang);
        if (filterMissingBoth && st.missingBoth) return true;
        if (filterMissingName && st.missingName) return true;
        if (filterMissingDesc && st.missingDesc) return true;
        return false;
      });
    }
    const q = searchQuery.trim();
    if (q) {
      list = list.filter(item =>
        [...getItemSearchFields(item), item.item_type ?? ''].some(f => fuzzyMatch(f, q))
      );
    }
    return list;
  }, [allItems, searchQuery, filterOnlyOverridden, filterOnlyHidden, filterMissingName, filterMissingDesc, filterMissingBoth, filterTranslationLang, overrides, getItemTranslationStatus]);

  const totalOverriddenItems = useMemo(() => {
    return Object.values(overrides).filter(o => o && Object.keys(o).length > 0).length;
  }, [overrides]);

  const totalHiddenItems = useMemo(() => {
    return Object.values(overrides).filter(o => o?.hidden).length;
  }, [overrides]);

  const totalMissingName = useMemo(() => {
    return allItems.filter(item => getItemTranslationStatus(item, filterTranslationLang).missingName).length;
  }, [allItems, getItemTranslationStatus, filterTranslationLang]);

  const totalMissingDesc = useMemo(() => {
    return allItems.filter(item => getItemTranslationStatus(item, filterTranslationLang).missingDesc).length;
  }, [allItems, getItemTranslationStatus, filterTranslationLang]);

  const totalMissingBoth = useMemo(() => {
    return allItems.filter(item => getItemTranslationStatus(item, filterTranslationLang).missingBoth).length;
  }, [allItems, getItemTranslationStatus, filterTranslationLang]);

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
    value: string | undefined
  ) => {
    setOverrides(prev => {
      const updated = { ...prev };
      const current = { ...(updated[selectedItemId] || {}) };
      const currentTranslations = { ...(current.translations || {}) };
      const langEntry = { ...(currentTranslations[lang] || {}) };

      if (value === undefined) {
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
    setConfirmModalConfig({
      title: 'Ripristina Overrides',
      message: 'Sei sicuro di voler ripristinare tutti gli override?',
      description: 'Tutti gli override torneranno allo stato iniziale di items-overrides.json. Le modifiche non esportate andranno perse.',
      confirmText: 'Ripristina Tutto',
      variant: 'warning',
      onConfirm: () => {
        setOverrides((initialOverrides as ItemOverrideMap) || {});
        localStorage.removeItem('dev_items_overrides_draft');
      },
    });
  };

  const handleCopyJson = async () => {
    try {
      const currentJson = JSON.stringify(overrides, null, 2);
      await navigator.clipboard.writeText(currentJson);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      alert('Impossibile copiare negli appunti');
    }
  };

  const handleDownloadJson = () => {
    const currentJson = JSON.stringify(overrides, null, 2);
    const blob = new Blob([currentJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lingue attive/tradotte per l'oggetto selezionato (da catalogo base o overrides)
  const activeLangsForItem = useMemo(() => {
    const langs = new Set<string>();
    if (selectedItemBase?.translations) {
      Object.keys(selectedItemBase.translations).forEach(l => {
        if (selectedItemBase.translations?.[l]?.name) langs.add(l);
      });
    }
    if (currentItemOverride.translations) {
      Object.keys(currentItemOverride.translations).forEach(l => {
        if (currentItemOverride.translations?.[l]?.name) langs.add(l);
      });
    }
    return Array.from(langs);
  }, [selectedItemBase, currentItemOverride]);

  return (
    <DevStudioLayout
      title="MetaForge Overrides Studio"
      subtitle={
        <>
          Modifica, dichiara ed esporta gli overrides locali per <code className="text-blue-500 font-mono">src/data/items-overrides.json</code>
        </>
      }
      icon={<FileJson size={18} className="text-blue-500" />}
      onBack={onBack}
      headerActions={
        <>
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
        </>
      }
      sidebar={
        <>
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
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-300">
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-purple-500" />
                  Mancanti ({filterTranslationLang.toUpperCase()}):
                </span>
                <select
                  value={filterTranslationLang}
                  onChange={e => {
                    const newLang = e.target.value;
                    setFilterTranslationLang(newLang);
                    setSelectedLang(newLang);
                  }}
                  className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-1.5 py-0.5 font-bold uppercase text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer text-[10px]"
                  title="Seleziona lingua del filtro"
                >
                  {AVAILABLE_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="dark:bg-gray-800">
                      {l.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs text-purple-800 dark:text-purple-300">
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-purple-900 dark:hover:text-purple-200">
                  <input
                    type="checkbox"
                    checked={filterMissingName}
                    onChange={e => {
                      setFilterMissingName(e.target.checked);
                      if (e.target.checked) setFilterMissingBoth(false);
                    }}
                    className="rounded text-purple-500"
                  />
                  <span>Senza nome / label ({totalMissingName})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-purple-900 dark:hover:text-purple-200">
                  <input
                    type="checkbox"
                    checked={filterMissingDesc}
                    onChange={e => {
                      setFilterMissingDesc(e.target.checked);
                      if (e.target.checked) setFilterMissingBoth(false);
                    }}
                    className="rounded text-purple-500"
                  />
                  <span>Senza descrizione ({totalMissingDesc})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-purple-900 dark:hover:text-purple-200 font-medium">
                  <input
                    type="checkbox"
                    checked={filterMissingBoth}
                    onChange={e => {
                      setFilterMissingBoth(e.target.checked);
                      if (e.target.checked) {
                        setFilterMissingName(false);
                        setFilterMissingDesc(false);
                      }
                    }}
                    className="rounded text-purple-500"
                  />
                  <span>Senza entrambe ({totalMissingBoth})</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredItems.map(item => (
              <SidebarItemRow
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                hasOverride={Boolean(overrides[item.id] && Object.keys(overrides[item.id]).length > 0)}
                isHidden={Boolean(overrides[item.id]?.hidden)}
                overrideName={overrides[item.id]?.name}
                overrideRarity={overrides[item.id]?.rarity}
                onSelect={handleSelect}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
                Nessun oggetto trovato
              </div>
            )}
          </div>
        </>
      }
      previewTitle="items-overrides.json"
      previewIcon={<FileJson size={14} className="text-blue-400" />}
      previewBadge={`${totalOverriddenItems} chiavi`}
      previewContent={<pre>{jsonString}</pre>}
    >
      {selectedItemBase ? (
        <>
          {/* Scheda di Anteprima Live */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ItemCardFrameV2
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
                    <div className="relative flex-1" ref={typeMenuRef}>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={typeMenu.open}
                        onClick={() => typeMenu.setOpen(o => !o)}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-left ${
                          currentItemOverride.item_type !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <CategoryBadge itemType={activeItemType} subcategory={activeSubcategory} size="xs" />
                        <span className="flex-1 truncate">{activeItemType || '—'}</span>
                        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${typeMenu.open ? 'rotate-180' : ''}`} />
                      </button>
                      {typeMenu.open && (
                        <div
                          role="listbox"
                          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1"
                        >
                          {itemTypeOptions.map(t => (
                            <button
                              key={t}
                              type="button"
                              role="option"
                              aria-selected={t === activeItemType}
                              onClick={() => {
                                handleFieldChange('item_type', t);
                                // La sottocategoria è legata al tipo precedente: si resetta al cambio tipo
                                handleFieldChange('subcategory', undefined);
                                typeMenu.setOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                t === activeItemType ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''
                              }`}
                            >
                              <CategoryBadge itemType={t} size="xs" />
                              <span className="truncate">{t}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <div className="relative flex-1" ref={subMenuRef}>
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={subMenu.open}
                        onClick={() => subMenu.setOpen(o => !o)}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-left ${
                          currentItemOverride.subcategory !== undefined ? 'border-amber-400 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <CategoryBadge itemType={activeItemType} subcategory={activeSubcategory} size="xs" />
                        <span className="flex-1 truncate">{activeSubcategory || 'Nessuna / Default'}</span>
                        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${subMenu.open ? 'rotate-180' : ''}`} />
                      </button>
                      {subMenu.open && (
                        <div
                          role="listbox"
                          className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1"
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={!activeSubcategory}
                            onClick={() => {
                              handleFieldChange('subcategory', null);
                              subMenu.setOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              !activeSubcategory ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''
                            }`}
                          >
                            <CategoryBadge itemType={activeItemType} size="xs" />
                            <span className="truncate">Nessuna / Default</span>
                          </button>
                          {subcategoryOptions.map(s => (
                            <button
                              key={s}
                              type="button"
                              role="option"
                              aria-selected={s === activeSubcategory}
                              onClick={() => {
                                handleFieldChange('subcategory', s);
                                subMenu.setOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                s === activeSubcategory ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' : ''
                              }`}
                            >
                              <CategoryBadge itemType={activeItemType} subcategory={s} size="xs" />
                              <span className="truncate">{s}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                  </select>
                </div>

                {/* Form Traduzione per la Lingua Selezionata */}
                {(() => {
                  const baseTrans = selectedItemBase?.translations?.[selectedLang];
                  const overrideTrans = currentItemOverride.translations?.[selectedLang];
                  const effectiveTransName = overrideTrans?.name !== undefined ? overrideTrans.name : (baseTrans?.name || '');
                  const effectiveTransDesc = overrideTrans?.description !== undefined ? overrideTrans.description : (baseTrans?.description || '');
                  const hasNameOverride = overrideTrans?.name !== undefined;
                  const hasDescOverride = overrideTrans?.description !== undefined;
                  const hasLangOverride = Boolean(overrideTrans && (overrideTrans.name !== undefined || overrideTrans.description !== undefined));

                  return (
                    <div className="space-y-4 pt-2">
                      {/* Nome Tradotto */}
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-3 flex flex-col">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Nome ({selectedLang.toUpperCase()})
                          </label>
                          {hasNameOverride ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Override attivo</span>
                          ) : baseTrans?.name ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Da catalogo base</span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Non tradotto</span>
                          )}
                        </div>
                        <div className="col-span-9 flex items-center gap-2">
                          <input
                            type="text"
                            value={effectiveTransName}
                            onChange={e => handleTranslationChange(selectedLang, 'name', e.target.value)}
                            placeholder={baseTrans?.name ? `Base: ${baseTrans.name}` : `Traduzione nome in ${selectedLang} (Default EN: ${selectedItemEffective.name})`}
                            className={`flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium ${
                              hasNameOverride
                                ? 'border-amber-400 dark:border-amber-600'
                                : baseTrans?.name
                                ? 'border-purple-200 dark:border-purple-800/70'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          />
                          {hasNameOverride && (
                            <button
                              onClick={() => handleTranslationChange(selectedLang, 'name', undefined)}
                              className="text-xs text-gray-400 hover:text-red-500 px-1"
                              title="Ripristina traduzione base del catalogo"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Descrizione Tradotta */}
                      <div className="space-y-1.5 pt-2 border-t border-purple-100 dark:border-purple-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              Descrizione ({selectedLang.toUpperCase()})
                            </label>
                            {hasDescOverride ? (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Override attivo</span>
                            ) : baseTrans?.description ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Da catalogo base</span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Non tradotta</span>
                            )}
                          </div>
                          {hasDescOverride && (
                            <button
                              onClick={() => handleTranslationChange(selectedLang, 'description', undefined)}
                              className="text-[11px] text-gray-400 hover:text-red-500"
                              title="Ripristina descrizione base del catalogo"
                            >
                              Ripristina traduzione base
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={effectiveTransDesc}
                          onChange={e => handleTranslationChange(selectedLang, 'description', e.target.value)}
                          placeholder={baseTrans?.description ? `Base: ${baseTrans.description}` : `Traduzione descrizione in ${selectedLang} (Default EN: ${selectedItemEffective.description})`}
                          className={`w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium leading-relaxed ${
                            hasDescOverride
                              ? 'border-amber-400 dark:border-amber-600'
                              : baseTrans?.description
                              ? 'border-purple-200 dark:border-purple-800/70'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        />
                      </div>

                      {/* Azione elimina traduzione lingua corrente */}
                      {hasLangOverride && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleClearLanguageTranslation(selectedLang)}
                            className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Rimuovi tutti gli override per {selectedLang.toUpperCase()}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Seleziona un oggetto dalla colonna di sinistra
            </div>
          )}

      {/* Generic Action Confirm Modal */}
      {confirmModalConfig !== null && (
        <ConfirmActionModal
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          description={confirmModalConfig.description}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          variant={confirmModalConfig.variant}
          onConfirm={confirmModalConfig.onConfirm}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}
    </DevStudioLayout>
  );
};
