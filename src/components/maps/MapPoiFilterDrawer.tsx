import { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  MapPin,
  Compass,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Drawer } from '@/components/Drawer';
import { useTranslation } from '@/i18n';
import {
  MACRO_GROUPS,
  getCategoryMacroGroup,
  getCategoryIconPath,
  groupQuestPoisByQuest,
  type MacroGroupId,
} from '@/lib/maps/map-filters';
import type { MapPoi } from '@/lib/maps/map-floors';

export type MapPoiFilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  allFloorPois: MapPoi[];
  disabledCategories: Set<string>;
  onToggleCategory: (category: string) => void;
  onSetCategoryBatch: (categories: string[], enable: boolean) => void;
  showZoneNameplates: boolean;
  onToggleZoneNameplates: () => void;
  showLootAreas?: boolean;
  onToggleLootAreas?: () => void;
  disabledQuestTitles: Set<string>;
  onToggleQuestTitle: (title: string) => void;
  onSetQuestBatch: (titles: string[], enable: boolean) => void;
  onFocusCoordinate?: (coord: [number, number]) => void;
};

export const MapPoiFilterDrawer = ({
  isOpen,
  onClose,
  allFloorPois,
  disabledCategories,
  onToggleCategory,
  onSetCategoryBatch,
  showZoneNameplates,
  onToggleZoneNameplates,
  showLootAreas = true,
  onToggleLootAreas,
  disabledQuestTitles,
  onToggleQuestTitle,
  onSetQuestBatch,
  onFocusCoordinate,
}: MapPoiFilterDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'categories' | 'quests'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Group POIs by category and count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allFloorPois) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [allFloorPois]);

  // Group categories by Macro-Group
  const categoriesByGroup = useMemo(() => {
    const map: Record<MacroGroupId, string[]> = {
      fixed: [],
      raid: [],
      ambient: [],
    };

    // Esclude 'quest' che ha il suo tab dedicato con controllo per singola missione
    const uniqueCats = Object.keys(categoryCounts).filter(c => c !== 'quest').sort();
    for (const cat of uniqueCats) {
      const grp = getCategoryMacroGroup(cat);
      map[grp].push(cat);
    }

    return map;
  }, [categoryCounts]);

  // Quests present on this floor/map
  const questGroups = useMemo(() => {
    return groupQuestPoisByQuest(allFloorPois);
  }, [allFloorPois]);

  if (!isOpen) return null;

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleGroupMasterToggle = (categories: string[]) => {
    const anyDisabled = categories.some(c => disabledCategories.has(c));
    if (anyDisabled) {
      // Enable all
      onSetCategoryBatch(categories, true);
    } else {
      // Disable all
      onSetCategoryBatch(categories, false);
    }
  };

  const filteredQuests = questGroups.filter(q =>
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.steps.some(s => s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Drawer from="bottom" onClose={onClose} title={t('maps.filterTitle')}>
      <div className="flex flex-col gap-3.5 h-[78dvh] -mb-2">
        {/* Segmented Control Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Layers size={14} />
            <span>{t('maps.categoriesTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'quests'
                ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Compass size={14} />
            <span>{t('maps.questsTab')}</span>
            {questGroups.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {questGroups.length}
              </span>
            )}
          </button>
        </div>

        {/* Content: Categories Tab */}
        {activeTab === 'categories' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3 overscroll-contain pb-6">
            {/* Zone Nameplates Master Switch */}
            <div className="shrink-0 flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {t('maps.zoneNameplates')}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {t('maps.zoneNameplatesDesc')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleZoneNameplates}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  showZoneNameplates
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {showZoneNameplates ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{showZoneNameplates ? t('maps.visible') : t('maps.hidden')}</span>
              </button>
            </div>

            {/* Loot Areas Master Switch */}
            {onToggleLootAreas && (
              <div className="shrink-0 flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Compass size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {t('maps.lootAreas')}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {t('maps.lootAreasDesc')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleLootAreas}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    showLootAreas
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {showLootAreas ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showLootAreas ? t('maps.visible') : t('maps.hidden')}</span>
                </button>
              </div>
            )}

            {/* 3 Macro Groups */}
            {MACRO_GROUPS.map(group => {
              const categories = categoriesByGroup[group.id] || [];
              if (categories.length === 0) return null;

              const isCollapsed = !!collapsedGroups[group.id];
              const allEnabled = categories.every(c => !disabledCategories.has(c));
              const groupTotalPois = categories.reduce((sum, c) => sum + (categoryCounts[c] || 0), 0);

              return (
                <div
                  key={group.id}
                  className="shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900/60"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="flex items-center gap-2 text-left cursor-pointer flex-1"
                    >
                      <span style={{ color: group.color }}>
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <span>{t(group.labelKey)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 font-medium text-gray-600 dark:text-gray-300">
                            {groupTotalPois}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {t(group.descriptionKey)}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGroupMasterToggle(categories)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {allEnabled ? t('maps.deselectAll') : t('maps.selectAll')}
                    </button>
                  </div>

                  {/* Group Categories Grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                      {categories.map(cat => {
                        const isEnabled = !disabledCategories.has(cat);
                        const count = categoryCounts[cat] || 0;
                        const iconPath = getCategoryIconPath(cat);
                        const displayLabel = cat.replace(/_/g, ' ');

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => onToggleCategory(cat)}
                            className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all cursor-pointer min-w-0 ${
                              isEnabled
                                ? 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                                : 'opacity-40 bg-gray-100/50 dark:bg-gray-900/40 border-transparent text-gray-400'
                            }`}
                          >
                            <span className="shrink-0 text-gray-400">
                              {isEnabled ? (
                                <CheckSquare size={14} className="text-blue-500" />
                              ) : (
                                <Square size={14} />
                              )}
                            </span>

                            {iconPath ? (
                              <img
                                src={iconPath}
                                alt={displayLabel}
                                className="size-4 shrink-0 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: group.color }}
                              />
                            )}

                            <span className="text-[11px] font-medium truncate flex-1 capitalize">
                              {displayLabel}
                            </span>

                            <span className="text-[10px] font-bold text-gray-400 shrink-0">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Content: Quests Tab */}
        {activeTab === 'quests' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3 overscroll-contain pb-6">
            {/* Search and Batch Actions */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('maps.searchQuest')}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={() => onSetQuestBatch(questGroups.map(q => q.title), true)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                {t('maps.selectAll')}
              </button>
              <button
                type="button"
                onClick={() => onSetQuestBatch(questGroups.map(q => q.title), false)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                {t('maps.deselectAll')}
              </button>
            </div>

            {filteredQuests.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                {t('maps.noQuestsOnMap')}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {filteredQuests.map(quest => {
                  const isEnabled = !disabledQuestTitles.has(quest.title);
                  const iconUrl = getCategoryIconPath('quest');

                  return (
                    <div
                      key={quest.title}
                      className={`shrink-0 p-3 rounded-2xl border transition-all ${
                        isEnabled
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                          : 'opacity-50 bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      {/* Quest Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => onToggleQuestTitle(quest.title)}
                          className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                        >
                          {isEnabled ? (
                            <CheckSquare size={16} className="text-amber-500 shrink-0" />
                          ) : (
                            <Square size={16} className="text-gray-400 shrink-0" />
                          )}
                          {iconUrl && (
                            <img src={iconUrl} alt="Quest" className="size-4 shrink-0 object-contain" />
                          )}
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {quest.title}
                          </span>
                          {quest.isSingleRaid && quest.steps.length > 1 && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30">
                              {t('maps.singleRaid')}
                            </span>
                          )}
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                          {quest.steps.length} {quest.steps.length === 1 ? 'step' : 'steps'}
                        </span>
                      </div>

                      {/* Quest Steps Sequence */}
                      <div className="flex flex-col gap-1.5 pl-6">
                        {quest.steps.map(step => (
                          <div
                            key={step.poiId}
                            onClick={() => onFocusCoordinate?.(step.coordinate)}
                            className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-300 hover:text-amber-500 cursor-pointer transition-colors"
                          >
                            {quest.isSequential && quest.steps.length > 1 ? (
                              <span className="size-4 rounded-full bg-amber-500 text-gray-950 font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                {step.stepNumber}
                              </span>
                            ) : (
                              <span className="size-1.5 rounded-full bg-amber-500/80 shrink-0 mt-1.5 ml-1 mr-1" />
                            )}
                            <span className="line-clamp-2 leading-tight">
                              {step.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};
