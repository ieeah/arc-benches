import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, ChevronRight, Layers } from "lucide-react";
import type { ItemInfo } from "@/types";
import { useAppStore } from "@/store";
import { getRarityText } from "@/lib/rarity";
import { SectionHeader } from "@/components/SectionHeader";
import { IconButton } from "@/components/IconButton";
import { ItemDetailSheet } from "@/components/ItemDetailSheet";
import { useListManager } from "@/hooks/useListManager";
import type { FilterCategory, SortOption } from "@/hooks/useListManager";
import { ListControls } from "@/components/ListControls";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { useTranslation, getItemName, getItemSearchFields, getRarityLabel } from "@/i18n";
import { StickyHeader } from '@/components/StickyHeader';
import {
  getBaseItem,
  getBaseItemForVariant,
  isVariantItem,
} from "@/lib/baseItems";

const RARITY_WEIGHTS: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const getRarityWeight = (rarity: string) =>
  RARITY_WEIGHTS[rarity.toLowerCase()] || 0;

export const ItemsPage = ({
  onBack,
  onOpenOverrides,
}: {
  onBack?: () => void;
  onOpenOverrides?: (itemId: string) => void;
}) => {
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const refinerLevel = useAppStore(
    (s) => s.currentLevels["refiner"] || 0
  );
  const [selected, setSelected] = useState<ItemInfo | null>(null);
  const [collapseVariants, setCollapseVariants] = useState<boolean>(true);
  const { t, language } = useTranslation();

  const filterCategories: FilterCategory<ItemInfo>[] = useMemo(() => [
    { id: "all", label: t('catalog.filterAll'), predicate: () => true },
    {
      id: "materials",
      label: t('catalog.filterMaterials'),
      predicate: (i: ItemInfo) =>
        [
          "basic material",
          "topside material",
          "refined material",
          "advanced material",
          "material",
          "recyclable",
        ].includes(i.item_type.toLowerCase()),
    },
    {
      id: "equipment",
      label: t('catalog.filterEquipment'),
      predicate: (i: ItemInfo) =>
        [
          "weapon",
          "throwable",
          "gadget",
          "modification",
          "augment",
          "shield",
          "ammunition",
          "armor",
        ].includes(i.item_type.toLowerCase()),
    },
    {
      id: "blueprints",
      label: t('catalog.filterBlueprints'),
      predicate: (i: ItemInfo) => i.item_type.toLowerCase() === "blueprint",
    },
    {
      id: "cosmetics",
      label: t('catalog.filterCosmetics'),
      predicate: (i: ItemInfo) => i.item_type.toLowerCase() === "cosmetic",
    },
    {
      id: "keys",
      label: t('catalog.filterKeys'),
      predicate: (i: ItemInfo) => i.item_type.toLowerCase() === "key",
    },
    {
      id: "quick-use",
      label: t('catalog.filterQuickUse'),
      predicate: (i: ItemInfo) =>
        ["medical", "consumable", "booster"].includes(
          i.item_type.toLowerCase()
        ),
    },
    {
      id: "trinkets",
      label: t('catalog.filterTrinkets'),
      predicate: (i: ItemInfo) =>
        ["trinket", "valuable"].includes(i.item_type.toLowerCase()),
    },
    {
      id: "other",
      label: t('catalog.filterOther'),
      predicate: (i: ItemInfo) =>
        [
          "basic material",
          "topside material",
          "refined material",
          "advanced material",
          "material",
          "recyclable",
          "weapon",
          "throwable",
          "gadget",
          "modification",
          "augment",
          "shield",
          "ammunition",
          "armor",
          "blueprint",
          "cosmetic",
          "key",
          "medical",
          "consumable",
          "booster",
          "trinket",
          "valuable",
        ].indexOf(i.item_type.toLowerCase()) === -1,
    },
  ], [t]);

  const sortOptions: SortOption<ItemInfo>[] = useMemo(() => [
    {
      id: "name_asc",
      label: t('catalog.sortName'),
      direction: "asc",
      indicatorType: "text",
      indicatorText: "A-Z",
      compare: (a: ItemInfo, b: ItemInfo) => {
        const nameA = getItemName(a, language);
        const nameB = getItemName(b, language);
        return nameA.localeCompare(nameB, language, { sensitivity: 'base' });
      },
      toggleId: "name_desc",
    },
    {
      id: "name_desc",
      label: t('catalog.sortName'),
      direction: "desc",
      indicatorType: "text",
      indicatorText: "Z-A",
      compare: (a: ItemInfo, b: ItemInfo) => {
        const nameA = getItemName(a, language);
        const nameB = getItemName(b, language);
        return nameB.localeCompare(nameA, language, { sensitivity: 'base' });
      },
      toggleId: "name_asc",
      hideFromUi: true,
    },
    {
      id: "rarity_desc",
      label: t('catalog.sortRarity'),
      direction: "desc",
      compare: (a: ItemInfo, b: ItemInfo) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity),
      toggleId: "rarity_asc",
    },
    {
      id: "rarity_asc",
      label: t('catalog.sortRarity'),
      direction: "asc",
      compare: (a: ItemInfo, b: ItemInfo) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity),
      toggleId: "rarity_desc",
      hideFromUi: true,
    },
    {
      id: "value_desc",
      label: t('catalog.sortValue'),
      direction: "desc",
      compare: (a: ItemInfo, b: ItemInfo) => (b.value ?? 0) - (a.value ?? 0),
      toggleId: "value_asc",
    },
    {
      id: "value_asc",
      label: t('catalog.sortValue'),
      direction: "asc",
      compare: (a: ItemInfo, b: ItemInfo) => (a.value ?? 0) - (b.value ?? 0),
      toggleId: "value_desc",
      hideFromUi: true,
    },
  ], [language, t]);

  // Nascondi sempre gli oggetti contrassegnati come 'hidden' nel catalogo principale
  const allItems = useMemo(
    () => Object.values(itemsInfo).filter((item) => !item.hidden),
    [itemsInfo],
  );

  // Elementi esposti: se collapseVariants è attivo, mostriamo i Base Items e nascondiamo le singole varianti
  const displayedItems = useMemo(() => {
    if (!collapseVariants) return allItems;
    return allItems.filter((item) => !isVariantItem(item.id));
  }, [allItems, collapseVariants]);

  // Ricerca estesa ai nomi delle varianti se raggruppate
  const getSearchFields = useCallback(
    (item: ItemInfo): string[] => {
      const base = getItemSearchFields(item);
      const baseDef = getBaseItem(item.id);
      if (!baseDef) return base;

      const extra: string[] = [baseDef.name];
      if (baseDef.translations) {
        for (const tr of Object.values(baseDef.translations)) {
          if (tr.name) extra.push(tr.name);
        }
      }
      for (const vId of baseDef.variantItemIds) {
        const vItem = itemsInfo[vId];
        if (vItem) {
          extra.push(vItem.name);
          if (vItem.translations) {
            for (const tr of Object.values(vItem.translations)) {
              if (tr.name) extra.push(tr.name);
            }
          }
        }
      }
      return Array.from(new Set([...base, ...extra]));
    },
    [itemsInfo],
  );

  const {
    query,
    setQuery,
    activeCategoryId,
    setActiveCategoryId,
    activeSortId,
    setActiveSortId,
    groupByEnabled,
    setGroupByEnabled,
    processedItems,
    groupedItems,
    groupKeys,
  } = useListManager<ItemInfo>({
    items: displayedItems,
    search: {
      fields: getSearchFields,
    },
    filters: {
      categories: filterCategories,
      defaultCategoryId: "all",
    },
    sorting: {
      options: sortOptions,
      defaultSortId: "name_asc",
    },
    grouping: {
      groupKey: (item) => item.item_type || t('catalog.filterOther'),
    },
  });

  return (
    <div className="pb-24">
      <StickyHeader>
        <SectionHeader
          title={t('catalog.title')}
          leading={
            onBack ? (
              <IconButton onClick={onBack}>
                <ArrowLeft size={16} />
              </IconButton>
            ) : undefined
          }
        />

        <div className="pt-1.5 pb-2">
          <ListControls
            query={query}
            setQuery={setQuery}
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
            activeSortId={activeSortId}
            setActiveSortId={setActiveSortId}
            groupByEnabled={groupByEnabled}
            setGroupByEnabled={setGroupByEnabled}
            searchPlaceholder={t('catalog.searchPlaceholder')}
            categories={filterCategories}
            sortOptions={sortOptions}
            showGroupingToggle={true}
            sortType="pills"
            items={allItems}
            extraActions={
              <button
                type="button"
                onClick={() => setCollapseVariants(!collapseVariants)}
                className={`flex items-center gap-1 shrink-0 cursor-pointer transition-colors py-1.5 px-1.5 rounded-lg ${
                  collapseVariants
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
                }`}
                title="Raggruppa i livelli e le varianti dello stesso oggetto in una sola card"
              >
                <Layers size={14} />
                <span className="text-xs">
                  {collapseVariants
                    ? (t('catalog.groupVariants') || 'Varianti')
                    : (t('catalog.showAllVariants') || 'Tutte')}
                </span>
              </button>
            }
          />
        </div>
      </StickyHeader>

      <div data-list-container="compact" className="p-3 pt-4">
        {groupByEnabled
          ? groupKeys.map((groupName) => (
              <div key={groupName} className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {groupName}
                </h3>
                <div data-list-container="compact">
                  {groupedItems?.[groupName].map((item) => {
                    const displayName = getItemName(item, language);
                    const baseDef = getBaseItem(item.id);
                    const parentBase = getBaseItemForVariant(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform cursor-pointer"
                      >
                        <ItemCardFrameV2
                          icon={item.icon}
                          alt={displayName}
                          rarity={item.rarity}
                          fallbackText={item.id}
                          className="w-12 h-12 shrink-0"
                          imgClassName="max-w-[85%] max-h-[85%] object-contain"
                          compact
                          thumb
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            <span
                              className={`font-bold ${getRarityText(item.rarity)}`}
                            >
                              {getRarityLabel(item.rarity, language)}
                            </span>{" "}
                            · {item.item_type}
                            {collapseVariants && baseDef && baseDef.variantItemIds.length > 0 && (
                              <span className="ml-1 text-indigo-500 font-semibold">
                                ({baseDef.variantItemIds.length} varianti)
                              </span>
                            )}
                            {!collapseVariants && parentBase && (
                              <span className="ml-1 text-gray-500 font-semibold">
                                · Var. di {parentBase.name}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-gray-300 dark:text-gray-600 shrink-0"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          : processedItems.map((item) => {
              const displayName = getItemName(item, language);
              const baseDef = getBaseItem(item.id);
              const parentBase = getBaseItemForVariant(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <ItemCardFrameV2
                    icon={item.icon}
                    alt={displayName}
                    rarity={item.rarity}
                    fallbackText={item.id}
                    className="w-12 h-12 shrink-0"
                    imgClassName="max-w-[85%] max-h-[85%] object-contain"
                    compact
                    thumb
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{displayName}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      <span
                        className={`font-bold ${getRarityText(item.rarity)}`}
                      >
                        {getRarityLabel(item.rarity, language)}
                      </span>{" "}
                      · {item.item_type}
                      {collapseVariants && baseDef && baseDef.variantItemIds.length > 0 && (
                        <span className="ml-1 text-indigo-500 font-semibold">
                          ({baseDef.variantItemIds.length} varianti)
                        </span>
                      )}
                      {!collapseVariants && parentBase && (
                        <span className="ml-1 text-gray-500 font-semibold">
                          · Var. di {parentBase.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 dark:text-gray-600 shrink-0"
                  />
                </button>
              );
            })}

        {processedItems.length === 0 && (
          <p className="p-10 text-center text-gray-500 italic text-sm">
            Nessun oggetto trovato.
          </p>
        )}
      </div>

      {selected && (
        <ItemDetailSheet
          item={selected}
          refinerLevel={refinerLevel}
          onClose={() => setSelected(null)}
          onOpenOverrides={onOpenOverrides}
        />
      )}
    </div>
  );
};
