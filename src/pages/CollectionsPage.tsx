import React, { useMemo } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { SectionHeader } from '@/components/SectionHeader';
import { ListControls } from '@/components/ListControls';
import { PageLayout } from '@/components/PageLayout';
import { CollectionHubCard } from '@/components/collections/CollectionHubCard';
import { BlueprintCard } from '@/components/BlueprintCard';
import { DesignCard } from '@/components/collections/DesignCard';
import { StencilCard } from '@/components/collections/StencilCard';
import { CollectibleListItem } from '@/components/collections/CollectibleListItem';
import { useListManager } from '@/hooks/useListManager';
import type { FilterCategory, SortOption } from '@/hooks/useListManager';
import {
  getAllBlueprintsPure,
  getAllDesignsPure,
  getAllStencilsPure,
  getGlobalCollectionsProgressPure,
} from '@/store/selectors';
import type { ItemInfo } from '@/types';
import { useTranslation, getItemName, getItemSearchFields } from '@/i18n';
import { useRouter } from '@/router';
import {
  getBlueprintCategory,
  getFurnitureCategory,
} from '@/lib/collections';
import { rarityOrder } from '@/lib/rarity';

type ChildCollectionTab = 'blueprints' | 'designs' | 'stencils';

export const CollectionsPage: React.FC = () => {
  const router = useRouter();
  const { t, language } = useTranslation();

  // Store data & actions
  const itemsInfo = useAppStore(s => s.itemsInfo);
  const ownedBlueprints = useAppStore(s => s.ownedBlueprints);
  const ownedDesigns = useAppStore(s => s.ownedDesigns);
  const ownedStencils = useAppStore(s => s.ownedStencils);

  const filterHideOwnedBlueprints = useAppStore(s => s.filterHideOwnedBlueprints);
  const filterHideOwnedDesigns = useAppStore(s => s.filterHideOwnedDesigns);
  const filterHideOwnedStencils = useAppStore(s => s.filterHideOwnedStencils);

  const collectionsViewMode = useAppStore(s => s.collectionsViewMode);
  const setCollectionsViewMode = useAppStore(s => s.setCollectionsViewMode);

  const toggleBlueprintOwned = useAppStore(s => s.toggleBlueprintOwned);
  const toggleDesignOwned = useAppStore(s => s.toggleDesignOwned);
  const toggleStencilOwned = useAppStore(s => s.toggleStencilOwned);

  const setFilterHideOwnedBlueprints = useAppStore(s => s.setFilterHideOwnedBlueprints);
  const setFilterHideOwnedDesigns = useAppStore(s => s.setFilterHideOwnedDesigns);
  const setFilterHideOwnedStencils = useAppStore(s => s.setFilterHideOwnedStencils);

  // Active view: Parent Hub (no tab) or Child View (tab = blueprints | designs | stencils)
  const currentTab = useMemo<ChildCollectionTab | null>(() => {
    const rawTab = router.params.tab;
    if (rawTab === 'blueprints' || rawTab === 'designs' || rawTab === 'stencils') {
      return rawTab;
    }
    return null;
  }, [router.params.tab]);

  // Global collections progress
  const progress = useMemo(() => {
    return getGlobalCollectionsProgressPure(
      itemsInfo,
      ownedBlueprints,
      ownedDesigns,
      ownedStencils
    );
  }, [itemsInfo, ownedBlueprints, ownedDesigns, ownedStencils]);

  // Current collection raw items
  const rawItems = useMemo<ItemInfo[]>(() => {
    if (currentTab === 'blueprints') {
      return getAllBlueprintsPure(itemsInfo);
    }
    if (currentTab === 'designs') {
      return getAllDesignsPure(itemsInfo);
    }
    if (currentTab === 'stencils') {
      return getAllStencilsPure(itemsInfo);
    }
    return [];
  }, [currentTab, itemsInfo]);

  // Specific owned map & filter for current child tab
  const { currentOwnedMap, currentFilterHide, toggleCurrentFilterHide } = useMemo(() => {
    if (currentTab === 'designs') {
      return {
        currentOwnedMap: ownedDesigns,
        currentFilterHide: filterHideOwnedDesigns,
        toggleCurrentFilterHide: () => setFilterHideOwnedDesigns(!filterHideOwnedDesigns),
      };
    }
    if (currentTab === 'stencils') {
      return {
        currentOwnedMap: ownedStencils,
        currentFilterHide: filterHideOwnedStencils,
        toggleCurrentFilterHide: () => setFilterHideOwnedStencils(!filterHideOwnedStencils),
      };
    }
    return {
      currentOwnedMap: ownedBlueprints,
      currentFilterHide: filterHideOwnedBlueprints,
      toggleCurrentFilterHide: () => setFilterHideOwnedBlueprints(!filterHideOwnedBlueprints),
    };
  }, [
    currentTab,
    ownedBlueprints,
    ownedDesigns,
    ownedStencils,
    filterHideOwnedBlueprints,
    filterHideOwnedDesigns,
    filterHideOwnedStencils,
    setFilterHideOwnedBlueprints,
    setFilterHideOwnedDesigns,
    setFilterHideOwnedStencils,
  ]);

  // Filter out owned items if filter is active
  const displayedItems = useMemo(() => {
    if (!currentFilterHide) return rawItems;
    return rawItems.filter(item => !currentOwnedMap[item.id]);
  }, [rawItems, currentFilterHide, currentOwnedMap]);

  // Dynamic Categories based on active child tab
  const categories = useMemo<FilterCategory<ItemInfo>[]>(() => {
    if (currentTab === 'blueprints') {
      return [
        { id: 'all', label: t('collections.categories.all'), predicate: () => true },
        { id: 'weapon', label: t('collections.categories.weapon'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'weapon' },
        { id: 'modification', label: t('collections.categories.modification'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'modification' },
        { id: 'explosive', label: t('collections.categories.explosive'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'explosive' },
        { id: 'utility', label: t('collections.categories.utility'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'utility' },
        { id: 'medical', label: t('collections.categories.medical'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'medical' },
        { id: 'augment', label: t('collections.categories.augment'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'augment' },
        { id: 'material', label: t('collections.categories.material'), predicate: item => getBlueprintCategory(item, itemsInfo) === 'material' },
      ];
    }

    if (currentTab === 'designs') {
      return [
        { id: 'all', label: t('collections.categories.all'), predicate: () => true },
        { id: 'storage', label: t('collections.categories.storage'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'storage' },
        { id: 'seating', label: t('collections.categories.seating'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'seating' },
        { id: 'tables', label: t('collections.categories.tables'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'tables' },
        { id: 'lighting', label: t('collections.categories.lighting'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'lighting' },
        { id: 'beds', label: t('collections.categories.beds'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'beds' },
        { id: 'decoration', label: t('collections.categories.decoration'), predicate: item => getFurnitureCategory(item, itemsInfo) === 'decoration' },
      ];
    }

    if (currentTab === 'stencils') {
      return [
        { id: 'all', label: t('collections.rarity.all'), predicate: () => true },
        { id: 'Legendary', label: t('collections.rarity.legendary'), predicate: item => (item.rarity || '').toLowerCase() === 'legendary' },
        { id: 'Epic', label: t('collections.rarity.epic'), predicate: item => (item.rarity || '').toLowerCase() === 'epic' },
        { id: 'Rare', label: t('collections.rarity.rare'), predicate: item => (item.rarity || '').toLowerCase() === 'rare' },
        { id: 'Uncommon', label: t('collections.rarity.uncommon'), predicate: item => (item.rarity || '').toLowerCase() === 'uncommon' },
      ];
    }

    return [];
  }, [currentTab, itemsInfo, t]);

  // Sort Options
  const sortOptions: SortOption<ItemInfo>[] = useMemo(() => [
    {
      id: 'name_asc',
      label: t('collections.sortName'),
      direction: 'asc',
      indicatorType: 'text',
      indicatorText: 'A-Z',
      compare: (a, b) => {
        const nameA = getItemName(a, language);
        const nameB = getItemName(b, language);
        return nameA.localeCompare(nameB, language, { sensitivity: 'base' });
      },
      toggleId: 'name_desc',
    },
    {
      id: 'name_desc',
      label: t('collections.sortName'),
      direction: 'desc',
      indicatorType: 'text',
      indicatorText: 'Z-A',
      compare: (a, b) => {
        const nameA = getItemName(a, language);
        const nameB = getItemName(b, language);
        return nameB.localeCompare(nameA, language, { sensitivity: 'base' });
      },
      toggleId: 'name_asc',
      hideFromUi: true,
    },
    {
      id: 'owned_last',
      label: t('collections.sortStatus'),
      direction: 'asc',
      compare: (a, b) => {
        const aOwned = currentOwnedMap[a.id] ? 1 : 0;
        const bOwned = currentOwnedMap[b.id] ? 1 : 0;
        return aOwned - bOwned || getItemName(a, language).localeCompare(getItemName(b, language), language);
      },
      toggleId: 'owned_first',
    },
    {
      id: 'owned_first',
      label: t('collections.sortStatus'),
      direction: 'desc',
      compare: (a, b) => {
        const aOwned = currentOwnedMap[a.id] ? 1 : 0;
        const bOwned = currentOwnedMap[b.id] ? 1 : 0;
        return bOwned - aOwned || getItemName(a, language).localeCompare(getItemName(b, language), language);
      },
      toggleId: 'owned_last',
      hideFromUi: true,
    },
    {
      id: 'rarity_desc',
      label: t('collections.sortRarity'),
      direction: 'desc',
      compare: (a, b) => {
        const orderA = rarityOrder[a.rarity?.toLowerCase() ?? 'common'] ?? 0;
        const orderB = rarityOrder[b.rarity?.toLowerCase() ?? 'common'] ?? 0;
        return orderB - orderA || getItemName(a, language).localeCompare(getItemName(b, language), language);
      },
      toggleId: 'rarity_asc',
    },
    {
      id: 'rarity_asc',
      label: t('collections.sortRarity'),
      direction: 'asc',
      compare: (a, b) => {
        const orderA = rarityOrder[a.rarity?.toLowerCase() ?? 'common'] ?? 0;
        const orderB = rarityOrder[b.rarity?.toLowerCase() ?? 'common'] ?? 0;
        return orderA - orderB || getItemName(a, language).localeCompare(getItemName(b, language), language);
      },
      toggleId: 'rarity_desc',
      hideFromUi: true,
    },
  ], [currentOwnedMap, language, t]);

  // List Manager
  const {
    query,
    setQuery,
    activeCategoryId,
    setActiveCategoryId,
    activeSortId,
    setActiveSortId,
    processedItems,
  } = useListManager<ItemInfo>({
    items: displayedItems,
    search: {
      fields: getItemSearchFields,
      debounceMs: 200,
    },
    filters: {
      categories,
      defaultCategoryId: 'all',
    },
    sorting: {
      options: sortOptions,
      defaultSortId: 'name_asc',
    },
  });

  // Current tab progress numbers
  const currentTabProgress = useMemo(() => {
    if (currentTab === 'blueprints') return progress.blueprints;
    if (currentTab === 'designs') return progress.designs;
    if (currentTab === 'stencils') return progress.stencils;
    return progress.total;
  }, [currentTab, progress]);

  // Search placeholder for child view
  const searchPlaceholder = useMemo(() => {
    if (currentTab === 'blueprints') return t('collections.blueprints.searchPlaceholder');
    if (currentTab === 'designs') return t('collections.designs.searchPlaceholder');
    if (currentTab === 'stencils') return t('collections.stencils.searchPlaceholder');
    return t('stash.searchPlaceholder');
  }, [currentTab, t]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. VISTA GENITORE (HUB COLLEZIONI)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!currentTab) {
    return (
      <PageLayout
        headerSlot={
          <div className="space-y-3">
            <SectionHeader
              title={t('collections.title')}
            />

            {/* Progresso Globale Collezioni */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress.total.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  <strong className="text-blue-500 font-bold font-mono text-xs">{progress.total.ownedCount}</strong> / {progress.total.totalCount} {t('collections.title')} ({progress.total.percentage}%)
                </span>
                <span>
                  {progress.total.ownedCount === progress.total.totalCount && progress.total.totalCount > 0 ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> {t('common.done')}!
                    </span>
                  ) : (
                    `${progress.total.totalCount - progress.total.ownedCount} ${t('stash.filterMissing').toLowerCase()}`
                  )}
                </span>
              </div>
            </div>
          </div>
        }
        className="w-full min-w-0"
      >
        <div className="w-full">
          <div className="flex flex-col gap-4 sm:gap-4.5">
            {/* 1. Progetti & Blueprint */}
            <CollectionHubCard
              collectionKey="blueprints"
              title={t('collections.hub.blueprintsTitle')}
              description={t('collections.hub.blueprintsDesc')}
              ownedCount={progress.blueprints.ownedCount}
              totalCount={progress.blueprints.totalCount}
              percentage={progress.blueprints.percentage}
              onClick={() => router.push('collections', { tab: 'blueprints' })}
              accentGradient="from-blue-500 to-indigo-500"
            />

            {/* 2. Design & Arredi */}
            <CollectionHubCard
              collectionKey="designs"
              title={t('collections.hub.designsTitle')}
              description={t('collections.hub.designsDesc')}
              ownedCount={progress.designs.ownedCount}
              totalCount={progress.designs.totalCount}
              percentage={progress.designs.percentage}
              onClick={() => router.push('collections', { tab: 'designs' })}
              accentGradient="from-amber-500 to-orange-500"
            />

            {/* 3. Stencil Armi */}
            <CollectionHubCard
              collectionKey="stencils"
              title={t('collections.hub.stencilsTitle')}
              description={t('collections.hub.stencilsDesc')}
              ownedCount={progress.stencils.ownedCount}
              totalCount={progress.stencils.totalCount}
              percentage={progress.stencils.percentage}
              onClick={() => router.push('collections', { tab: 'stencils' })}
              accentGradient="from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </PageLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. VISTE FIGLIE (BLUEPRINTS, DESIGNS, STENCILS)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      headerSlot={
        <div className="space-y-2.5">
          {/* Tasto Ritorno all'Hub Collezioni */}
          <div>
            <button
              onClick={() => router.push('collections')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer py-1 active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>{t('collections.backToHub')}</span>
            </button>
          </div>

          <SectionHeader
            title={t(`collections.${currentTab}.title`)}
            actions={
              <div className="flex items-center gap-2">
                {/* Switch Vista Griglia / Lista */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setCollectionsViewMode('grid')}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      collectionsViewMode === 'grid'
                        ? 'bg-white dark:bg-gray-900 text-blue-500 shadow-xs'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={t('collections.viewGrid')}
                    aria-label={t('collections.viewGrid')}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setCollectionsViewMode('list')}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      collectionsViewMode === 'list'
                        ? 'bg-white dark:bg-gray-900 text-blue-500 shadow-xs'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={t('collections.viewList')}
                    aria-label={t('collections.viewList')}
                  >
                    <ListIcon size={14} />
                  </button>
                </div>

                {/* Filtro Nascondi Posseduti */}
                <button
                  onClick={toggleCurrentFilterHide}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer active:scale-95 ${
                    currentFilterHide
                      ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                  }`}
                  title={currentFilterHide ? t('collections.showOwned') : t('collections.hideOwned')}
                  aria-label={currentFilterHide ? t('collections.showOwned') : t('collections.hideOwned')}
                >
                  {currentFilterHide ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span className="hidden sm:inline">
                    {currentFilterHide ? t('stash.filterMissing') : t('stash.filterAll')}
                  </span>
                </button>
              </div>
            }
          />

          {/* Barra di Progresso della Collezione Attiva */}
          <div className="space-y-1">
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentTabProgress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                <strong className="text-blue-500 font-bold font-mono text-xs">{currentTabProgress.ownedCount}</strong> / {currentTabProgress.totalCount} ({currentTabProgress.percentage}%)
              </span>
              <span>
                {currentTabProgress.ownedCount === currentTabProgress.totalCount && currentTabProgress.totalCount > 0 ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t('common.done')}!
                  </span>
                ) : (
                  `${currentTabProgress.totalCount - currentTabProgress.ownedCount} ${t('stash.filterMissing').toLowerCase()}`
                )}
              </span>
            </div>
          </div>

          <ListControls
            query={query}
            setQuery={setQuery}
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={setActiveCategoryId}
            activeSortId={activeSortId}
            setActiveSortId={setActiveSortId}
            groupByEnabled={false}
            setGroupByEnabled={() => {}}
            categories={categories}
            sortOptions={sortOptions}
            searchPlaceholder={searchPlaceholder}
            items={displayedItems}
            sortType="pills"
          />
        </div>
      }
      className="w-full min-w-0"
    >
      <div className="w-full">
        {processedItems.length === 0 ? (
          <div className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] text-center space-y-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('common.none')}</p>
            <p className="text-xs text-gray-400">
              {currentFilterHide ? t('listDetail.completed') : searchPlaceholder}
            </p>
          </div>
        ) : collectionsViewMode === 'grid' ? (
          /* ── GRIGLIA FIGLIA (2 COLS MOBILE, 3 COLS TABLET/DESKTOP) ── */
          <div data-list-container className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {processedItems.map(item => {
              if (currentTab === 'blueprints') {
                return (
                  <BlueprintCard
                    key={item.id}
                    blueprint={item}
                    isOwned={Boolean(ownedBlueprints[item.id])}
                    onToggleOwned={() => toggleBlueprintOwned(item.id)}
                  />
                );
              }
              if (currentTab === 'designs') {
                return (
                  <DesignCard
                    key={item.id}
                    design={item}
                    itemsInfo={itemsInfo}
                    isOwned={Boolean(ownedDesigns[item.id])}
                    onToggleOwned={() => toggleDesignOwned(item.id)}
                  />
                );
              }
              return (
                <StencilCard
                  key={item.id}
                  stencil={item}
                  isOwned={Boolean(ownedStencils[item.id])}
                  onToggleOwned={() => toggleStencilOwned(item.id)}
                />
              );
            })}
          </div>
        ) : (
          /* ── LISTA FIGLIA ORIZZONTALE COMPATTA ── */
          <div data-list-container className="flex flex-col gap-2">
            {processedItems.map(item => {
              if (currentTab === 'blueprints') {
                const target = item.unlocks_item_id ? itemsInfo[item.unlocks_item_id] : null;
                const displayName = getItemName(item, language).replace(/\s*Blueprint\s*/i, '');
                const targetName = target ? getItemName(target, language) : '';
                return (
                  <CollectibleListItem
                    key={item.id}
                    title={displayName}
                    subtitle={targetName}
                    icon={item.icon}
                    rarity={item.rarity}
                    itemType="Blueprint"
                    isOwned={Boolean(ownedBlueprints[item.id])}
                    onToggle={() => toggleBlueprintOwned(item.id)}
                  />
                );
              }
              if (currentTab === 'designs') {
                const target = item.unlocks_item_id ? itemsInfo[item.unlocks_item_id] : null;
                const displayItem = target || item;
                const displayName = getItemName(displayItem, language).replace(/\s*Design\s*/i, '');
                const categoryKey = getFurnitureCategory(item, itemsInfo);
                const categoryLabel = t(`collections.categories.${categoryKey}`);
                return (
                  <CollectibleListItem
                    key={item.id}
                    title={displayName}
                    subtitle={categoryLabel}
                    icon={displayItem.icon || item.icon}
                    rarity={item.rarity || displayItem.rarity}
                    itemType="Design"
                    isOwned={Boolean(ownedDesigns[item.id])}
                    onToggle={() => toggleDesignOwned(item.id)}
                  />
                );
              }
              const displayName = getItemName(item, language).replace(/\s*Stencil\s*/i, '');
              const rarityKey = (item.rarity || 'common').toLowerCase();
              const rarityLabel = t(`collections.rarity.${rarityKey}`) || item.rarity;
              return (
                <CollectibleListItem
                  key={item.id}
                  title={displayName}
                  subtitle={rarityLabel}
                  icon={item.icon}
                  rarity={item.rarity}
                  itemType="Stencil"
                  isOwned={Boolean(ownedStencils[item.id])}
                  onToggle={() => toggleStencilOwned(item.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
