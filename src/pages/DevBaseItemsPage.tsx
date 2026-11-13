import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Boxes,
  Plus,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  Download,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';
import { BlueprintCombobox } from '@/components/dev/BlueprintCombobox';
import { downloadTextFile } from '@/lib/devI18n';
import { getRarityText } from '@/lib/rarity';
import { useTranslation, getItemName, getItemSearchFields, SUPPORTED_LANGUAGES } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  type BaseItemDefinition,
  type ItemVariantsFile,
  getItemVariantsData,
  hasItemVariantsDraft,
  saveItemVariantsDraft,
  clearItemVariantsDraft,
  getSuggestedVariants,
  VARIANTS_CHANGED_EVENT,
} from '@/lib/baseItems';
import itemVariantsSeed from '@/data/item-variants.json';

type DevBaseItemsPageProps = {
  onBack: () => void;
};

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Amplified'] as const;

export function DevBaseItemsPage({ onBack }: DevBaseItemsPageProps) {
  const { language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const allCatalogItems = useMemo(() => Object.values(itemsInfo), [itemsInfo]);

  // Stato base items: inizializza con i dati attivi (compresa bozza)
  const [data, setData] = useState<ItemVariantsFile>(() => getItemVariantsData());
  const [selectedId, setSelectedId] = useState<string>('anvil');
  const [searchQuery, setSearchQuery] = useState('');
  const [variantSearchQuery, setVariantSearchQuery] = useState('');
  const [iconCatalogSearch, setIconCatalogSearch] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedTransLang, setSelectedTransLang] = useState<string>(() => (language !== 'en' ? language : 'it'));
  const iconPickerTriggerRef = useRef<HTMLButtonElement>(null);
  const iconPickerInputRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Focus automatico sull'input di ricerca icona alla comparsa del picker
  useEffect(() => {
    if (showIconPicker) {
      iconPickerInputRef.current?.focus();
    }
  }, [showIconPicker]);

  // Sincronizzazione con storage / eventi esterni
  useEffect(() => {
    const handleVariantsChanged = (e: Event) => {
      const custom = e as CustomEvent<ItemVariantsFile>;
      if (custom.detail) setData(custom.detail);
    };
    window.addEventListener(VARIANTS_CHANGED_EVENT, handleVariantsChanged);
    return () => window.removeEventListener(VARIANTS_CHANGED_EVENT, handleVariantsChanged);
  }, []);

  const baseItemsList = useMemo(() => {
    const list = Object.values(data.baseItems);
    list.sort((a, b) => a.name.localeCompare(b.name, language));
    return list;
  }, [data.baseItems, language]);

  const filteredBaseItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseItemsList;
    return baseItemsList.filter((b) => {
      if (b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)) return true;
      if (b.translations) {
        return Object.values(b.translations).some(
          (t) => t.name && t.name.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [baseItemsList, searchQuery]);

  const selectedBaseItem: BaseItemDefinition | undefined = data.baseItems[selectedId];

  // Helper opzioni per Tipo Oggetto
  const itemTypes = useMemo(() => {
    const set = new Set<string>();
    for (const it of allCatalogItems) {
      if (it.item_type) set.add(it.item_type);
    }
    return Array.from(set).sort();
  }, [allCatalogItems]);

  // Helper opzioni per Sottocategoria filtrate sul Tipo Oggetto selezionato
  const subcategoriesByType = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const it of allCatalogItems) {
      if (!it.item_type || !it.subcategory) continue;
      if (!map.has(it.item_type)) map.set(it.item_type, new Set());
      map.get(it.item_type)!.add(it.subcategory);
    }
    return map;
  }, [allCatalogItems]);

  const availableSubcategories = useMemo(() => {
    const currentType = selectedBaseItem?.item_type || '';
    const subs = subcategoriesByType.get(currentType) || new Set<string>();
    return Array.from(subs).sort();
  }, [subcategoriesByType, selectedBaseItem?.item_type]);

  // Helper per selezione Blueprint
  const blueprintItems = useMemo(() => {
    return allCatalogItems
      .filter((i) => i.item_type === 'Blueprint' || i.subcategory === 'Blueprint')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCatalogItems]);

  const AVAILABLE_TRANSLATION_LANGUAGES = useMemo(
    () => SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en'),
    [],
  );

  const updateData = (newData: ItemVariantsFile) => {
    setData(newData);
    saveItemVariantsDraft(newData);
  };

  const handleUpdateField = <K extends keyof BaseItemDefinition>(
    field: K,
    val: BaseItemDefinition[K],
  ) => {
    if (!selectedBaseItem) return;
    const updated: BaseItemDefinition = {
      ...selectedBaseItem,
      [field]: val,
    };
    updateData({
      baseItems: {
        ...data.baseItems,
        [selectedBaseItem.id]: updated,
      },
    });
  };

  // Reset automatico della sottocategoria al cambio del tipo oggetto (#143 followup)
  const handleUpdateItemType = (newType: string) => {
    if (!selectedBaseItem) return;
    const updated: BaseItemDefinition = {
      ...selectedBaseItem,
      item_type: newType,
      subcategory: null,
    };
    updateData({
      baseItems: {
        ...data.baseItems,
        [selectedBaseItem.id]: updated,
      },
    });
  };

  // Gestione traduzioni multi-lingua scalabile (salva solo se valorizzate)
  const handleUpdateTranslation = (lang: string, field: 'name' | 'description', val: string) => {
    if (!selectedBaseItem) return;
    const existingTrans = selectedBaseItem.translations || {};
    const langObj = { ...(existingTrans[lang] || {}), [field]: val };

    const nextTrans = { ...existingTrans };
    if (!langObj.name?.trim() && !langObj.description?.trim()) {
      delete nextTrans[lang];
    } else {
      nextTrans[lang] = langObj;
    }
    handleUpdateField('translations', Object.keys(nextTrans).length > 0 ? nextTrans : undefined);
  };

  const handleClearTranslation = (lang: string) => {
    if (!selectedBaseItem) return;
    const existingTrans = selectedBaseItem.translations || {};
    if (!existingTrans[lang]) return;
    const nextTrans = { ...existingTrans };
    delete nextTrans[lang];
    handleUpdateField('translations', Object.keys(nextTrans).length > 0 ? nextTrans : undefined);
  };

  // Creazione nuovo Base Item
  const handleCreateNew = () => {
    let newId = 'new-base-item';
    let counter = 1;
    while (data.baseItems[newId]) {
      newId = `new-base-item-${counter++}`;
    }
    const newBase: BaseItemDefinition = {
      id: newId,
      name: 'New Base Item',
      item_type: 'Weapon',
      subcategory: 'Hand Cannon',
      rarity: 'Common',
      icon: 'icons/items/anvil-i.webp',
      description: '',
      translations: {
        it: {
          name: 'Nuovo Base Item',
          description: '',
        },
      },
      variantItemIds: [],
    };
    updateData({
      baseItems: {
        ...data.baseItems,
        [newId]: newBase,
      },
    });
    setSelectedId(newId);
  };

  // Eliminazione Base Item
  const handleDeleteBaseItem = (id: string) => {
    setConfirmModal({
      title: 'Elimina Base Item',
      message: `Sei sicuro di voler eliminare il Base Item "${data.baseItems[id]?.name || id}"? Le varianti collegate non verranno eliminate dal catalogo ma torneranno indipendenti.`,
      onConfirm: () => {
        const next = { ...data.baseItems };
        delete next[id];
        updateData({ baseItems: next });
        const remaining = Object.keys(next);
        if (remaining.length > 0) {
          setSelectedId(remaining[0]);
        }
      },
    });
  };

  // Scarta modifiche e ripristina seed
  const handleDiscardChanges = () => {
    setConfirmModal({
      title: 'Scarta tutte le modifiche',
      message: 'Vuoi annullare tutte le modifiche locali ai Base Items e ripristinare il file originale da disco?',
      onConfirm: () => {
        clearItemVariantsDraft();
        setData(itemVariantsSeed as ItemVariantsFile);
        setSelectedId('anvil');
      },
    });
  };

  // Gestione aggiunta/rimozione varianti
  const handleAddVariant = (itemId: string) => {
    if (!selectedBaseItem) return;
    if (selectedBaseItem.variantItemIds.includes(itemId)) return;

    // Se l'oggetto appartiene già a un altro base item, lo rimuoviamo da quello
    const nextBaseItems = { ...data.baseItems };
    for (const [otherId, otherBase] of Object.entries(nextBaseItems)) {
      if (otherId !== selectedBaseItem.id && otherBase.variantItemIds.includes(itemId)) {
        nextBaseItems[otherId] = {
          ...otherBase,
          variantItemIds: otherBase.variantItemIds.filter((id) => id !== itemId),
        };
      }
    }

    // Se il base item non ha ancora un'icona valida, usiamo quella della variante
    let newIcon = selectedBaseItem.icon;
    const item = itemsInfo[itemId];
    if ((!newIcon || newIcon.includes('default')) && item?.icon) {
      newIcon = item.icon;
    }

    nextBaseItems[selectedBaseItem.id] = {
      ...selectedBaseItem,
      icon: newIcon,
      variantItemIds: [...selectedBaseItem.variantItemIds, itemId],
    };

    updateData({ baseItems: nextBaseItems });
  };

  const handleRemoveVariant = (itemId: string) => {
    if (!selectedBaseItem) return;
    handleUpdateField(
      'variantItemIds',
      selectedBaseItem.variantItemIds.filter((id) => id !== itemId),
    );
  };

  const handleMoveVariant = (index: number, direction: 'up' | 'down') => {
    if (!selectedBaseItem) return;
    const variants = [...selectedBaseItem.variantItemIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= variants.length) return;

    const temp = variants[index];
    variants[index] = variants[targetIndex];
    variants[targetIndex] = temp;

    handleUpdateField('variantItemIds', variants);
  };

  // Varianti suggerite dal catalogo
  const suggestedVariants = useMemo(() => {
    if (!selectedBaseItem) return [];
    const assignedSet = new Set(selectedBaseItem.variantItemIds);
    return getSuggestedVariants(selectedBaseItem.id, allCatalogItems, assignedSet);
  }, [selectedBaseItem, allCatalogItems]);

  const handleAddAllSuggestions = () => {
    if (!selectedBaseItem || suggestedVariants.length === 0) return;
    const newIds = suggestedVariants.map((v) => v.id);
    const set = new Set([...selectedBaseItem.variantItemIds, ...newIds]);
    handleUpdateField('variantItemIds', Array.from(set));
  };

  // Ricerca manuale da catalogo con supporto a tutte le lingue
  const manualCatalogCandidates = useMemo(() => {
    if (!selectedBaseItem || !variantSearchQuery.trim()) return [];
    const q = variantSearchQuery.trim().toLowerCase();
    const assignedSet = new Set(selectedBaseItem.variantItemIds);

    return allCatalogItems
      .filter((item) => {
        if (assignedSet.has(item.id) || data.baseItems[item.id]?.variantItemIds?.length) return false;
        return getItemSearchFields(item).some((f) => f.toLowerCase().includes(q));
      })
      .slice(0, 15);
  }, [selectedBaseItem, variantSearchQuery, allCatalogItems, data.baseItems]);

  // Ricerca icona da catalogo
  const iconCatalogCandidates = useMemo(() => {
    if (!iconCatalogSearch.trim()) return [];
    const q = iconCatalogSearch.trim().toLowerCase();
    return allCatalogItems
      .filter((i) => i.icon && (i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [iconCatalogSearch, allCatalogItems]);

  const isModified = hasItemVariantsDraft();

  const handleDownload = () => {
    downloadTextFile(
      'item-variants.json',
      JSON.stringify(data, null, 2) + '\n',
      'application/json',
    );
  };

  return (
    <DevStudioLayout
      title="Base Items & Varianti"
      subtitle="Accorpamento varianti d'arma, livelli (I-IV) e schemi omonimi"
      icon={<Boxes className="w-5 h-5 text-indigo-500" />}
      onBack={onBack}
      headerActions={
        <div className="flex items-center gap-2">
          {isModified && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              Scarta modifiche
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
            title="Scarica item-variants.json"
          >
            <Download size={14} />
            Scarica JSON
          </button>
          <ApplyToProjectButton artifactIds={['item-variants']} />
        </div>
      }
      sidebar={
        <div className="flex flex-col h-full p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca base item..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Nuovo Base Item"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
            {filteredBaseItems.length} Base Items
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredBaseItems.map((base) => {
              const isSel = base.id === selectedId;
              const localizedName = base.translations?.[language]?.name || base.name;
              return (
                <div
                  key={base.id}
                  onClick={() => setSelectedId(base.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-2 rounded-2xl cursor-pointer transition-all border text-left',
                    isSel
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
                  )}
                >
                  <ItemCardFrameV2
                    icon={base.icon || 'icons/default.webp'}
                    alt={base.name}
                    rarity={base.rarity || 'Common'}
                    itemType={base.item_type}
                    subcategory={base.subcategory}
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">
                      {localizedName}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {base.id} · <span className="font-semibold">{base.variantItemIds.length} var.</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      {selectedBaseItem ? (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {/* Header Overview Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
            <ItemCardFrameV2
              icon={selectedBaseItem.icon || 'icons/default.webp'}
              alt={selectedBaseItem.name}
              rarity={selectedBaseItem.rarity || 'Common'}
              itemType={selectedBaseItem.item_type}
              subcategory={selectedBaseItem.subcategory}
              className="w-16 h-16 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black truncate">
                  {selectedBaseItem.translations?.[language]?.name || selectedBaseItem.name}
                </h2>
                <span
                  className={cn(
                    'text-xs font-bold uppercase',
                    getRarityText(selectedBaseItem.rarity || 'Common'),
                  )}
                >
                  {selectedBaseItem.rarity || 'Common'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID univoco: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px] font-mono">{selectedBaseItem.id}</code>
                {' · '}
                {selectedBaseItem.variantItemIds.length} varianti collegate
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteBaseItem(selectedBaseItem.id)}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer shrink-0"
              title="Elimina questo Base Item"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Dati Principali */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Dati del Base Item
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Nome Base (Inglese)
                </label>
                <input
                  type="text"
                  value={selectedBaseItem.name}
                  onChange={(e) => handleUpdateField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Tipo Oggetto
                </label>
                <select
                  value={selectedBaseItem.item_type}
                  onChange={(e) => handleUpdateItemType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {itemTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Sottocategoria
                </label>
                <select
                  value={selectedBaseItem.subcategory || ''}
                  onChange={(e) => handleUpdateField('subcategory', e.target.value || null)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">(Nessuna sottocategoria)</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                  {selectedBaseItem.subcategory && !availableSubcategories.includes(selectedBaseItem.subcategory) && (
                    <option value={selectedBaseItem.subcategory}>
                      {selectedBaseItem.subcategory} (personalizzata)
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Rarità
                </label>
                <select
                  value={selectedBaseItem.rarity || 'Common'}
                  onChange={(e) => handleUpdateField('rarity', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Descrizione Base (Inglese)
                </label>
                <textarea
                  rows={2}
                  value={selectedBaseItem.description || ''}
                  onChange={(e) => handleUpdateField('description', e.target.value)}
                  placeholder="Descrizione base in lingua inglese..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    Icona Oggetto
                  </label>
                  <button
                    ref={iconPickerTriggerRef}
                    type="button"
                    onClick={() => {
                      if (showIconPicker) {
                        setShowIconPicker(false);
                        setTimeout(() => iconPickerTriggerRef.current?.focus(), 0);
                      } else {
                        setShowIconPicker(true);
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon size={12} />
                    {showIconPicker ? 'Chiudi ricerca' : 'Cerca icona da catalogo'}
                  </button>
                </div>

                {/* Selezione rapida dalle varianti collegate */}
                {selectedBaseItem.variantItemIds.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1 font-semibold">
                      Usa icona da una variante collegata:
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedBaseItem.variantItemIds.map((vId) => {
                        const item = itemsInfo[vId];
                        if (!item?.icon) return null;
                        const isCurrent = selectedBaseItem.icon === item.icon;
                        return (
                          <button
                            key={vId}
                            type="button"
                            onClick={() => handleUpdateField('icon', item.icon || '')}
                            className={cn(
                              'relative p-1 rounded-xl border transition-all cursor-pointer',
                              isCurrent
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-xs ring-1 ring-indigo-500'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400',
                            )}
                            title={`Usa icona di ${item.name} (${vId})`}
                          >
                            <img
                              src={item.icon}
                              alt={item.name}
                              className="w-7 h-7 object-contain"
                            />
                            {isCurrent && (
                              <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                <Check size={8} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Strumento di ricerca icone da catalogo completo */}
                {showIconPicker && (
                  <div className="p-2.5 mb-2 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        ref={iconPickerInputRef}
                        type="text"
                        value={iconCatalogSearch}
                        onChange={(e) => setIconCatalogSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowIconPicker(false);
                            setTimeout(() => iconPickerTriggerRef.current?.focus(), 0);
                          }
                        }}
                        placeholder="Cerca oggetto per prenderne l'icona (Escape per chiudere)..."
                        className="w-full pl-8 pr-2 py-1 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs"
                      />
                    </div>
                    {iconCatalogCandidates.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                        {iconCatalogCandidates.map((cand) => (
                          <button
                            key={cand.id}
                            type="button"
                            onClick={() => {
                              handleUpdateField('icon', cand.icon || '');
                              setShowIconPicker(false);
                              setTimeout(() => iconPickerTriggerRef.current?.focus(), 0);
                            }}
                            className="flex flex-col items-center p-1 bg-white dark:bg-gray-900 rounded-xl border border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-500 transition-all cursor-pointer"
                            title={`${cand.name} (${cand.id})`}
                          >
                            <img
                              src={cand.icon!}
                              alt={cand.name}
                              className="w-7 h-7 object-contain"
                            />
                            <span className="text-[9px] truncate max-w-full text-gray-500">
                              {cand.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={selectedBaseItem.icon || ''}
                  onChange={(e) => handleUpdateField('icon', e.target.value)}
                  placeholder="icons/items/..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              {/* Blueprint / Schema Collegato con Autocomplete Combobox */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-300">
                  Blueprint / Schema Collegato
                </label>
                <BlueprintCombobox
                  value={selectedBaseItem.blueprintItemId}
                  onChange={(bpId) => handleUpdateField('blueprintItemId', bpId)}
                  blueprints={blueprintItems}
                />
              </div>
            </div>
          </div>

          {/* Traduzioni Multi-lingua */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Traduzioni Multi-lingua
                </h3>
              </div>
              <span className="text-[11px] font-bold text-gray-400">
                {Object.keys(selectedBaseItem.translations || {}).filter(k => selectedBaseItem.translations?.[k]?.name).length} traduzioni attive
              </span>
            </div>

            {/* Selettore lingua a pillole orizzontali */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {AVAILABLE_TRANSLATION_LANGUAGES.map((lang) => {
                const isSelected = selectedTransLang === lang.code;
                const hasTranslation = Boolean(selectedBaseItem.translations?.[lang.code]?.name);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedTransLang(lang.code)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95',
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    <span className="text-[10px] opacity-75 uppercase">({lang.code})</span>
                    {hasTranslation && (
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isSelected ? 'bg-white' : 'bg-emerald-500',
                        )}
                        title="Traduzione presente"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Form per la lingua selezionata */}
            {(() => {
              const currentLangObj = AVAILABLE_TRANSLATION_LANGUAGES.find((l) => l.code === selectedTransLang) || {
                code: selectedTransLang,
                label: selectedTransLang.toUpperCase(),
                flag: '🌐',
              };
              const currentTrans = selectedBaseItem.translations?.[selectedTransLang] || {};
              const hasTrans = Boolean(currentTrans.name || currentTrans.description);

              return (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Campi per {currentLangObj.flag} {currentLangObj.label} ({currentLangObj.code.toUpperCase()})
                    </span>
                    {hasTrans && (
                      <button
                        type="button"
                        onClick={() => handleClearTranslation(selectedTransLang)}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Svuota traduzione
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-gray-600 dark:text-gray-300">
                        Nome ({currentLangObj.label})
                      </label>
                      <input
                        type="text"
                        value={currentTrans.name || ''}
                        onChange={(e) => handleUpdateTranslation(selectedTransLang, 'name', e.target.value)}
                        placeholder={`Nome in ${currentLangObj.label}...`}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-gray-600 dark:text-gray-300">
                        Descrizione ({currentLangObj.label})
                      </label>
                      <textarea
                        rows={2}
                        value={currentTrans.description || ''}
                        onChange={(e) => handleUpdateTranslation(selectedTransLang, 'description', e.target.value)}
                        placeholder={`Descrizione opzionale in ${currentLangObj.label}...`}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Se non compilata, l'app userà come ripiego il nome/descrizione base in inglese o i testi dal catalogo.
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Varianti Collegate */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Varianti Collegate ({selectedBaseItem.variantItemIds.length})
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Queste varianti saranno raggruppate sotto questo Base Item e nascoste dai picker utente standard.
                </p>
              </div>
            </div>

            {selectedBaseItem.variantItemIds.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                Nessuna variante collegata. Usa i suggerimenti qui sotto o cerca nel catalogo per aggiungerne.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedBaseItem.variantItemIds.map((vId, idx) => {
                  const item = itemsInfo[vId];
                  const localizedName = item ? getItemName(item, language) : vId;
                  return (
                    <div
                      key={vId}
                      className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl"
                    >
                      <ItemCardFrameV2
                        icon={item?.icon || 'icons/default.webp'}
                        alt={item?.name || vId}
                        rarity={item?.rarity || 'Common'}
                        itemType={item?.item_type}
                        subcategory={item?.subcategory}
                        className="w-10 h-10 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs truncate">
                            {localizedName}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] font-bold',
                              getRarityText(item?.rarity || 'Common'),
                            )}
                          >
                            · {item?.rarity || 'Common'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {vId}
                        </p>
                      </div>

                      {/* Riordino Up / Down */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveVariant(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 cursor-pointer"
                          title="Sposta su"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveVariant(idx, 'down')}
                          disabled={idx === selectedBaseItem.variantItemIds.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 cursor-pointer"
                          title="Sposta giù"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Rimuovi variante */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(vId)}
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                        title="Rimuovi variante"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Varianti Suggerite dal Catalogo */}
          {suggestedVariants.length > 0 && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Suggerimenti Automatici ({suggestedVariants.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddAllSuggestions}
                  className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  + Associa tutte
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedVariants.slice(0, 8).map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/40 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ItemCardFrameV2
                        icon={cand.icon || 'icons/default.webp'}
                        alt={cand.name}
                        rarity={cand.rarity}
                        itemType={cand.item_type}
                        subcategory={cand.subcategory}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {getItemName(cand, language)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {cand.id}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddVariant(cand.id)}
                      className="px-2 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 rounded-lg shrink-0 cursor-pointer"
                    >
                      + Aggiungi
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ricerca manuale nel catalogo */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Aggiungi Variante dal Catalogo
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={variantSearchQuery}
                onChange={(e) => setVariantSearchQuery(e.target.value)}
                placeholder="Cerca qualsiasi oggetto per nome o ID..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {manualCatalogCandidates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {manualCatalogCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ItemCardFrameV2
                        icon={cand.icon || 'icons/default.webp'}
                        alt={cand.name}
                        rarity={cand.rarity}
                        itemType={cand.item_type}
                        subcategory={cand.subcategory}
                        className="w-8 h-8 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {getItemName(cand, language)}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {cand.id}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddVariant(cand.id)}
                      className="px-2 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300 rounded-lg shrink-0 cursor-pointer"
                    >
                      + Aggiungi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-sm text-gray-400">
          Seleziona un Base Item dalla barra laterale o creane uno nuovo.
        </div>
      )}

      {confirmModal && (
        <ConfirmActionModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Conferma"
          variant="danger"
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal(null);
          }}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </DevStudioLayout>
  );
}
