import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ItemInfo } from "@/types";
import { useAppStore } from "@/store";
import { getRarityText } from "@/lib/rarity";
import { SectionHeader } from "@/components/SectionHeader";
import { IconButton } from "@/components/IconButton";
import { ItemDetailSheet } from "@/components/ItemDetailSheet";
import { useListManager } from "@/hooks/useListManager";
import type { FilterCategory, SortOption } from "@/hooks/useListManager";
import { ListControls } from "@/components/ListControls";
import { ItemCardFrame } from "@/components/ItemCardFrame";
import { useTranslation, getItemName, getItemSearchFields, getRarityLabel } from "@/i18n";

const RARITY_WEIGHTS: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const getRarityWeight = (rarity: string) =>
  RARITY_WEIGHTS[rarity.toLowerCase()] || 0;

const FILTER_CATEGORIES: FilterCategory<ItemInfo>[] = [
  { id: "all", label: "Tutti", predicate: () => true },
  {
    id: "materials",
    label: "Materiali",
    predicate: (i) =>
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
    label: "Armi & Equip",
    predicate: (i) =>
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
    label: "Blueprint",
    predicate: (i) => i.item_type.toLowerCase() === "blueprint",
  },
  {
    id: "cosmetics",
    label: "Cosmetici",
    predicate: (i) => i.item_type.toLowerCase() === "cosmetic",
  },
  {
    id: "keys",
    label: "Chiavi",
    predicate: (i) => i.item_type.toLowerCase() === "key",
  },
  {
    id: "quick-use",
    label: "Uso Rapido",
    predicate: (i) =>
      ["medical", "consumable", "booster"].includes(
        i.item_type.toLowerCase()
      ),
  },
  {
    id: "trinkets",
    label: "Trinket",
    predicate: (i) =>
      ["trinket", "valuable"].includes(i.item_type.toLowerCase()),
  },
  {
    id: "other",
    label: "Altro",
    predicate: (i) =>
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
];

const SORT_OPTIONS: SortOption<ItemInfo>[] = [
  {
    id: "name_asc",
    label: "A-Z",
    compare: (a, b) => a.name.localeCompare(b.name, "it"),
    toggleId: "name_desc",
  },
  {
    id: "name_desc",
    label: "Z-A",
    compare: (a, b) => b.name.localeCompare(a.name, "it"),
    toggleId: "name_asc",
    hideFromUi: true,
  },
  {
    id: "rarity_desc",
    label: "Rarità (Decrescente)",
    compare: (a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity),
    toggleId: "rarity_asc",
  },
  {
    id: "rarity_asc",
    label: "Rarità (Crescente)",
    compare: (a, b) => getRarityWeight(a.rarity) - getRarityWeight(b.rarity),
    toggleId: "rarity_desc",
    hideFromUi: true,
  },
  {
    id: "value_desc",
    label: "Valore (Decrescente)",
    compare: (a, b) => b.value - a.value,
    toggleId: "value_asc",
  },
  {
    id: "value_asc",
    label: "Valore (Crescente)",
    compare: (a, b) => a.value - b.value,
    toggleId: "value_desc",
    hideFromUi: true,
  },
];

export const ItemsPage = ({ onBack }: { onBack: () => void }) => {
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const refinerLevel = useAppStore(
    (s) => s.hideoutLevels["refiner"] || 0
  );
  const [selected, setSelected] = useState<ItemInfo | null>(null);
  const { t, language } = useTranslation();

  // Nascondi sempre gli oggetti contrassegnati come 'hidden' nel catalogo principale
  const allItems = Object.values(itemsInfo).filter((item) => !item.hidden);

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
    items: allItems,
    search: {
      fields: getItemSearchFields,
    },
    filters: {
      categories: FILTER_CATEGORIES,
      defaultCategoryId: "all",
    },
    sorting: {
      options: SORT_OPTIONS,
      defaultSortId: "name_asc",
    },
    grouping: {
      groupKey: (item) => item.item_type || "Altro",
    },
  });

  return (
    <div className="pb-28">
      <div className="p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="mb-3">
          <SectionHeader
            title={t('nav.catalog')}
            leading={
              <IconButton onClick={onBack} title="Indietro">
                <ArrowLeft size={16} />
              </IconButton>
            }
          />
        </div>
        <ListControls
          query={query}
          setQuery={setQuery}
          activeCategoryId={activeCategoryId}
          setActiveCategoryId={setActiveCategoryId}
          activeSortId={activeSortId}
          setActiveSortId={setActiveSortId}
          groupByEnabled={groupByEnabled}
          setGroupByEnabled={setGroupByEnabled}
          searchPlaceholder={t('common.search')}
          categories={FILTER_CATEGORIES}
          sortOptions={SORT_OPTIONS}
          showGroupingToggle={true}
          sortType="pills"
          items={allItems}
        />
      </div>

      <div data-list-container="compact" className="p-3">
        {groupByEnabled
          ? groupKeys.map((groupName) => (
              <div key={groupName} className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {groupName}
                </h3>
                <div data-list-container="compact">
                  {groupedItems?.[groupName].map((item) => {
                    const displayName = getItemName(item, language);
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform cursor-pointer"
                      >
                        <ItemCardFrame
                          icon={item.icon}
                          alt={displayName}
                          rarity={item.rarity}
                          fallbackText={item.id}
                          className="w-12 h-12 shrink-0"
                          imgClassName="max-w-[85%] max-h-[85%] object-contain"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            <span
                              className={`font-bold ${getRarityText(item.rarity)}`}
                            >
                              {getRarityLabel(item.rarity, language)}
                            </span>{" "}
                            · {item.item_type}
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
              return (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="w-full flex items-center gap-3 p-2.5 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] card-concentric-20 squircle text-left active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <ItemCardFrame
                    icon={item.icon}
                    alt={displayName}
                    rarity={item.rarity}
                    fallbackText={item.id}
                    className="w-12 h-12 shrink-0"
                    imgClassName="max-w-[85%] max-h-[85%] object-contain"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{displayName}</p>
                    <p className="text-[10px] text-gray-400">
                      <span
                        className={`font-bold ${getRarityText(item.rarity)}`}
                      >
                        {getRarityLabel(item.rarity, language)}
                      </span>{" "}
                      · {item.item_type}
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
        />
      )}
    </div>
  );
};
