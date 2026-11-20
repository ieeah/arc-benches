import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Hammer,
  Zap,
  Wrench,
  Recycle,
  Search,
  ShoppingCart,
  FileText,
  ShieldCheck,
  Compass,
  ArrowRight,
  ExternalLink,
  FlaskConical,
  Home,
  Info,
  Clock,
} from 'lucide-react';
import type { ItemInfo } from '@/types';
import type { BaseItemDefinition } from '@/lib/baseItems';
import {
  getItemRecipe,
  getRecyclingSources,
  getEvolutionTimeline,
  getNextUpgradeStep,
  getStationDisplayName,
  type EvolutionStep,
  type RecyclingSource,
} from '@/lib/recipes';
import {
  getTraderPurchase,
  getTraderDisplayName,
  getTraderCurrency,
  getTimeUntilDailyReset,
} from '@/lib/traders';
import { getLootAreas } from '@/lib/lootArea';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { useTranslation, getItemName } from '@/i18n';
import { useAppStore } from '@/store';
import { isSectionActive } from '@/lib/sections';

type TabKey = 'crafting' | 'upgrades' | 'repair' | 'recycling' | 'howToObtain';

type ItemRecipeDetailsProps = {
  item: ItemInfo;
  baseDef?: BaseItemDefinition;
  onSelectItem: (itemId: string) => void;
};

export const ItemRecipeDetails = ({
  item,
  baseDef,
  onSelectItem,
}: ItemRecipeDetailsProps) => {
  const { t, language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const ownedBlueprints = useAppStore((s) => s.ownedBlueprints);
  const isBlueprintsActive = useAppStore((s) => isSectionActive('blueprints', s));

  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [showAllSources, setShowAllSources] = useState(false);

  const recipe = useMemo(() => getItemRecipe(item.id), [item.id]);
  const recyclingSources = useMemo(() => getRecyclingSources(item.id), [item.id]);
  const lootAreas = useMemo(() => getLootAreas(item.loot_area, 13), [item.loot_area]);
  const traderPurchase = useMemo(() => getTraderPurchase(item.id), [item.id]);
  const dailyReset = useMemo(() => getTimeUntilDailyReset(), []);

  const isBaseItem = Boolean(baseDef && baseDef.id === item.id);
  const evolution = useMemo(() => {
    if (!baseDef) return undefined;
    return getEvolutionTimeline(baseDef);
  }, [baseDef]);

  const nextUpgrade = useMemo(() => getNextUpgradeStep(item.id), [item.id]);

  const variantRecipes = useMemo(() => {
    if (!isBaseItem || !baseDef) return [];
    return baseDef.variantItemIds.map((variantId, idx) => {
      const vItem = itemsInfo[variantId];
      const vName = vItem ? getItemName(vItem, language) : variantId;
      const romanMatch = vName.match(/\b(I|II|III|IV)\b$/);
      const levelLabel = romanMatch ? romanMatch[1] : `Lv.${idx + 1}`;
      return {
        variantId,
        variantName: vName,
        levelLabel,
        recipe: getItemRecipe(variantId),
      };
    });
  }, [isBaseItem, baseDef, itemsInfo, language]);

  // Calcolo delle tab disponibili
  const availableTabs = useMemo(() => {
    const tabs: { key: TabKey; label: string; icon: typeof Hammer }[] = [];

    // 1. Fabbricazione
    if (recipe?.crafting) {
      tabs.push({
        key: 'crafting',
        label: t('itemDetail.tabCrafting'),
        icon: Hammer,
      });
    }

    // 2. Potenziamento
    const hasEvolution = Boolean(
      isBaseItem &&
        evolution &&
        (evolution.steps.length > 0 || evolution.amplificationBranches.length > 0),
    );
    const hasVariantUpgrade = Boolean(
      !isBaseItem &&
        (nextUpgrade.nextStep || nextUpgrade.amplificationBranches.length > 0),
    );
    if (hasEvolution || hasVariantUpgrade) {
      tabs.push({
        key: 'upgrades',
        label: t('itemDetail.tabUpgrades'),
        icon: Zap,
      });
    }

    // 3. Riparazione (singola variante o livello per livello per Base Item)
    const hasRepair = isBaseItem
      ? variantRecipes.some((v) => Boolean(v.recipe?.repair))
      : Boolean(recipe?.repair);
    if (hasRepair) {
      tabs.push({
        key: 'repair',
        label: t('itemDetail.tabRepair'),
        icon: Wrench,
      });
    }

    // 4. Riciclo / Smantellamento (singola variante o livello per livello per Base Item)
    const hasRecycling = isBaseItem
      ? variantRecipes.some(
          (v) =>
            Boolean(
              v.recipe?.recycling &&
                (v.recipe.recycling.recyclesInto || v.recipe.recycling.salvagesInto),
            ),
        )
      : Boolean(
          recipe?.recycling &&
            (recipe.recycling.recyclesInto || recipe.recycling.salvagesInto),
        );
    if (hasRecycling) {
      tabs.push({
        key: 'recycling',
        label: t('itemDetail.tabRecycling'),
        icon: Recycle,
      });
    }

    // 5. Come ottenerlo (loot area, commercianti, fonti da riciclo di altri oggetti)
    if (recyclingSources.length > 0 || lootAreas.length > 0 || traderPurchase !== null) {
      tabs.push({
        key: 'howToObtain',
        label: t('itemDetail.tabHowToObtain'),
        icon: Search,
      });
    }

    return tabs;
  }, [recipe, isBaseItem, variantRecipes, evolution, nextUpgrade, recyclingSources, lootAreas, traderPurchase, t]);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const dragStateRef = useRef<{ isDown: boolean; startX: number; scrollLeft: number; dragged: boolean }>({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    dragged: false,
  });

  const handleTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !tabsRef.current) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: tabsRef.current.scrollLeft,
      dragged: false,
    };
  };

  const handleTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.isDown || !tabsRef.current) return;
    const dx = e.clientX - st.startX;
    if (Math.abs(dx) > 4) st.dragged = true;
    if (st.dragged) {
      tabsRef.current.scrollLeft = st.scrollLeft - dx;
    }
  };

  const handleTabsPointerUp = () => {
    dragStateRef.current.isDown = false;
  };

  const updateScrollEdges = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setScrollEdges((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right },
    );
  }, []);

  useEffect(() => {
    updateScrollEdges();
    const el = tabsRef.current;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollEdges) : null;
    if (ro && el) ro.observe(el);
    window.addEventListener('resize', updateScrollEdges);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScrollEdges);
    };
  }, [availableTabs, updateScrollEdges]);

  // Allinea activeTab alla prima disponibile se quella corrente non esiste più
  const effectiveTab = useMemo(() => {
    if (availableTabs.length === 0) return null;
    if (activeTab && availableTabs.some((t) => t.key === activeTab)) {
      return activeTab;
    }
    return availableTabs[0].key;
  }, [availableTabs, activeTab]);

  if (availableTabs.length === 0 || !effectiveTab) {
    return null;
  }

  // Helper per renderizzare un singolo ingrediente cliccabile
  const renderIngredient = (ingId: string, qty: number) => {
    const ingItem = itemsInfo[ingId];
    const name = ingItem ? getItemName(ingItem, language) : ingId;

    return (
      <button
        key={ingId}
        type="button"
        onClick={() => onSelectItem(ingId)}
        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left shadow-xs group cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {ingItem ? (
            <ItemCardFrameV2
              icon={ingItem.icon}
              alt={name}
              rarity={ingItem.rarity}
              itemType={ingItem.item_type}
              subcategory={ingItem.subcategory}
              className="w-8 h-8 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-400">
              ?
            </div>
          )}
          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono font-bold shrink-0">
          ×{qty}
        </span>
      </button>
    );
  };

  // Helper per renderizzare una card di uno step di evoluzione
  const renderEvolutionStepCard = (step: EvolutionStep, idx: number) => {
    const targetItem = itemsInfo[step.toItemId];
    const targetName = targetItem ? getItemName(targetItem, language) : step.toLevelName;

    return (
      <div
        key={`${step.fromItemId}-${step.toItemId}-${idx}`}
        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 dark:border-gray-700/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              {step.fromLevelName}
            </span>
            <ArrowRight size={14} className="text-gray-400" />
            <button
              type="button"
              onClick={() => onSelectItem(step.toItemId)}
              className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{step.toLevelName}</span>
              <ExternalLink size={10} className="opacity-70" />
            </button>
          </div>
          <span className="text-[11px] font-medium text-gray-500 truncate max-w-[120px]">
            {targetName}
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            {t('itemDetail.ingredientsRequired')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {Object.entries(step.ingredients).map(([ingId, qty]) =>
              renderIngredient(ingId, qty),
            )}
          </div>
        </div>

        {/* Requisiti aggiuntivi (Ricerca o Stazione) */}
        {step.requires && step.requires.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
            {step.requires.map((req, rIdx) => {
              if (req.type === 'research' && req.itemId) {
                const resItem = itemsInfo[req.itemId];
                const resName = resItem ? getItemName(resItem, language) : req.itemId;
                return (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
                  >
                    <FlaskConical size={11} className="text-purple-500" />
                    <span>Ricerca: {resName}</span>
                  </span>
                );
              }
              if (req.type === 'station') {
                return (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                  >
                    <Hammer size={11} className="text-blue-500" />
                    <span>{getStationDisplayName(req.station)} Lvl {req.level}</span>
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  // Helper per renderizzare un ramo di amplificazione con relativi requisiti
  const renderAmplificationBranch = (branch: EvolutionStep) => {
    const targetItem = itemsInfo[branch.toItemId];
    const targetName = targetItem ? getItemName(targetItem, language) : branch.toItemId;

    return (
      <div
        key={branch.toItemId}
        className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectItem(branch.toItemId)}
            className="font-bold text-amber-900 dark:text-amber-100 hover:underline cursor-pointer flex items-center gap-1.5 truncate"
          >
            <Zap size={13} className="text-amber-500 shrink-0" />
            <span className="truncate">{targetName}</span>
          </button>
          <span className="text-[11px] font-mono text-gray-500 shrink-0">
            {Object.entries(branch.ingredients)
              .map(([k, v]) => `${v}× ${itemsInfo[k] ? getItemName(itemsInfo[k], language) : k}`)
              .join(', ')}
          </span>
        </div>

        {/* Ricerca o Stazione richiesta per l'amplificazione */}
        {branch.requires && branch.requires.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-100 dark:border-amber-900/40">
            {branch.requires.map((req, rIdx) => {
              if (req.type === 'research' && req.itemId) {
                const resItem = itemsInfo[req.itemId];
                const resName = resItem ? getItemName(resItem, language) : req.itemId;
                return (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
                  >
                    <FlaskConical size={11} className="text-purple-500" />
                    <span>Ricerca: {resName}</span>
                  </span>
                );
              }
              if (req.type === 'station') {
                return (
                  <span
                    key={rIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                  >
                    <Hammer size={11} className="text-blue-500" />
                    <span>{getStationDisplayName(req.station)} Lvl {req.level}</span>
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="my-4 space-y-3">
      {/* Avviso informativo per Base Item */}
      {isBaseItem && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
          <Info size={14} className="shrink-0 text-blue-500" />
          <span>{t('itemDetail.overviewNotice')}</span>
        </div>
      )}

      {/* ── Pills / Tabs di Navigazione (bordo primary + glow sopra le pill + drag mouse) ── */}
      <div className="relative">
        {scrollEdges.left && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 border-l-2 border-blue-500 bg-gradient-to-r from-blue-500/25 to-transparent"
          />
        )}
        {scrollEdges.right && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 border-r-2 border-blue-500 bg-gradient-to-l from-blue-500/25 to-transparent"
          />
        )}
        <div
          ref={tabsRef}
          onScroll={updateScrollEdges}
          onPointerDown={handleTabsPointerDown}
          onPointerMove={handleTabsPointerMove}
          onPointerUp={handleTabsPointerUp}
          onPointerLeave={handleTabsPointerUp}
          className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none select-none cursor-grab active:cursor-grabbing"
        >
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = effectiveTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (dragStateRef.current.dragged) {
                    dragStateRef.current.dragged = false;
                    return;
                  }
                  setActiveTab(tab.key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'opacity-70'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenuto Scheda ── */}
      <div className="rounded-2xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 p-3.5 space-y-3">
        {/* 1. FABBRICAZIONE */}
        {effectiveTab === 'crafting' && recipe?.crafting && (
          <div className="space-y-3">
            {/* Stazioni abilitate & Blueprint */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {t('itemDetail.enabledBenches')}
                </span>
                {recipe.crafting.craftQuantity > 1 && (
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                    Produce ×{recipe.crafting.craftQuantity}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.entries(recipe.crafting.benches).map(([benchId, req]) => {
                  const isInRaid = benchId === 'in-raid' || benchId === 'in_raid';
                  const stationName = getStationDisplayName(benchId);

                  return (
                    <div
                      key={benchId}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
                        isInRaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Hammer size={12} className={isInRaid ? 'text-emerald-600' : 'text-blue-500'} />
                      <span>{stationName}</span>
                      {req.levelRequired != null && !isInRaid && (
                        <span className="font-bold opacity-80">Lvl {req.levelRequired}</span>
                      )}
                      {req.skillRequired && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-1 rounded">
                          {req.skillRequired}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Blueprint: mostrato SOLO se effettivamente necessario */}
              {recipe.crafting.blueprintRequired && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs">
                  <FileText size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-200">
                      {t('itemDetail.blueprintRequired')}
                    </p>
                  </div>
                  {/* Se il modulo blueprints è attivo, mostriamo lo stato posseduto/mancante */}
                  {isBlueprintsActive && baseDef?.blueprintItemId && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        ownedBlueprints[baseDef.blueprintItemId]
                          ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {ownedBlueprints[baseDef.blueprintItemId]
                        ? t('itemDetail.blueprintOwned')
                        : t('itemDetail.blueprintMissing')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Ingredienti */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {t('itemDetail.ingredientsRequired')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.entries(recipe.crafting.ingredients).map(([ingId, qty]) =>
                  renderIngredient(ingId, qty),
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. POTENZIAMENTO */}
        {effectiveTab === 'upgrades' && (
          <div className="space-y-3">
            {/* Caso Base Item: scaletta completa */}
            {isBaseItem && evolution && (
              <>
                {evolution.steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Zap size={14} className="text-blue-500" />
                      <span>{t('itemDetail.upgradeEvolutionTree')}</span>
                    </p>
                    <div className="space-y-2">
                      {evolution.steps.map((step, idx) =>
                        renderEvolutionStepCard(step, idx),
                      )}
                    </div>
                  </div>
                )}

                {/* Sezione Amplificazioni per il Base Item */}
                {evolution.amplificationBranches.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                      <Zap size={14} className="text-amber-500" />
                      <span>{t('itemDetail.amplifiedUpgrades')}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      {t('itemDetail.amplifiedRequires')}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {evolution.amplificationBranches.map((branch) =>
                        renderAmplificationBranch(branch),
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Caso Variante Singola: solo il prossimo livello o rami amplificati */}
            {!isBaseItem && (
              <>
                {nextUpgrade.nextStep && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Zap size={14} className="text-blue-500" />
                      <span>{t('itemDetail.nextUpgradeStep')}</span>
                    </p>
                    {renderEvolutionStepCard(nextUpgrade.nextStep, 0)}
                  </div>
                )}

                {/* Rami amplificati se siamo al Lvl IV */}
                {nextUpgrade.amplificationBranches.length > 0 && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                      <Zap size={14} className="text-amber-500" />
                      <span>{t('itemDetail.amplifiedUpgrades')}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      {t('itemDetail.amplifiedRequires')}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {nextUpgrade.amplificationBranches.map((branch) =>
                        renderAmplificationBranch(branch),
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. RIPARAZIONE */}
        {effectiveTab === 'repair' && (isBaseItem ? variantRecipes.some(v => v.recipe?.repair) : Boolean(recipe?.repair)) && (
          <div className="space-y-3">
            {/* Contesti Rifugio vs In-Raid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Rifugio */}
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-gray-100">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span>{t('itemDetail.repairShelter')}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('itemDetail.shelterRepairDesc')}
                </p>
              </div>

              {/* In-Raid */}
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <Compass size={14} className="text-emerald-600" />
                  <span>{t('itemDetail.repairInRaid')}</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  {t('itemDetail.fieldRepairDesc')}
                </p>
              </div>
            </div>

            {isBaseItem ? (
              <div className="space-y-2.5 pt-1">
                {variantRecipes
                  .filter((v) => Boolean(v.recipe?.repair))
                  .map((v) => (
                    <div
                      key={v.variantId}
                      className="p-3 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectItem(v.variantId)}
                          className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{v.levelLabel}</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </button>
                        <span className="text-[11px] font-medium text-gray-500 truncate">
                          {v.variantName}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {Object.entries(v.recipe!.repair!.cost).map(([ingId, qty]) =>
                          renderIngredient(ingId, qty),
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              recipe?.repair && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {t('itemDetail.repairMaterials')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {Object.entries(recipe.repair.cost).map(([ingId, qty]) =>
                      renderIngredient(ingId, qty),
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* 4. RICICLO & SMANTELLAMENTO */}
        {effectiveTab === 'recycling' && (isBaseItem ? variantRecipes.some(v => v.recipe?.recycling && (v.recipe.recycling.recyclesInto || v.recipe.recycling.salvagesInto)) : Boolean(recipe?.recycling)) && (
          <div className="space-y-3">
            {isBaseItem ? (
              variantRecipes
                .filter(
                  (v) =>
                    v.recipe?.recycling &&
                    (v.recipe.recycling.recyclesInto || v.recipe.recycling.salvagesInto),
                )
                .map((v) => {
                  const rec = v.recipe!.recycling!;
                  return (
                    <div
                      key={v.variantId}
                      className="p-3 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/60 pb-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectItem(v.variantId)}
                          className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{v.levelLabel}</span>
                          <ExternalLink size={10} className="opacity-70" />
                        </button>
                        <span className="text-[11px] font-medium text-gray-500 truncate">
                          {v.variantName}
                        </span>
                      </div>

                      {rec.recyclesInto && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 dark:text-blue-200">
                            <Home size={13} className="text-blue-500 shrink-0" />
                            <span>{t('itemDetail.recyclingShelterTitle')}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {Object.entries(rec.recyclesInto).map(([matId, qty]) =>
                              renderIngredient(matId, qty),
                            )}
                          </div>
                        </div>
                      )}

                      {rec.salvagesInto && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                            <Compass size={13} className="text-emerald-600 shrink-0" />
                            <span>{t('itemDetail.salvagingInRaidTitle')}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {Object.entries(rec.salvagesInto).map(([matId, qty]) =>
                              renderIngredient(matId, qty),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              recipe?.recycling && (
                <>
                  {/* Riciclo nel Rifugio (Raffineria Speranza) */}
                  {recipe.recycling.recyclesInto && (
                    <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200">
                          <Home size={14} className="text-blue-500 shrink-0" />
                          <span>{t('itemDetail.recyclingShelterTitle')}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                          {t('itemDetail.recyclingShelterBadge')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t('itemDetail.recyclingShelterDesc')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {Object.entries(recipe.recycling.recyclesInto).map(([matId, qty]) =>
                          renderIngredient(matId, qty),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Smantellamento In-Raid (Sul campo) */}
                  {recipe.recycling.salvagesInto && (
                    <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          <Compass size={14} className="text-emerald-600 shrink-0" />
                          <span>{t('itemDetail.salvagingInRaidTitle')}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          {t('itemDetail.salvagingInRaidBadge')}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t('itemDetail.salvagingInRaidDesc')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {Object.entries(recipe.recycling.salvagesInto).map(([matId, qty]) =>
                          renderIngredient(matId, qty),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}

        {/* 5. COME OTTENERLO */}
        {effectiveTab === 'howToObtain' && (
          <div className="space-y-3">
            {/* Zone di Loot */}
            {lootAreas.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  {t('itemDetail.howToObtainLoot')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lootAreas.map((la) => (
                    <div
                      key={la.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {la.icon}
                      <span>{la.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acquisto Commerciante */}
            {traderPurchase !== null && (
              <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShoppingCart size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="font-semibold text-sky-900 dark:text-sky-200 truncate">
                      {getTraderDisplayName(traderPurchase.trader, language)}
                    </span>
                    {getTraderCurrency(traderPurchase.trader) === 'seeds' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium shrink-0">
                        {t('common.seeds')}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-sky-700 dark:text-sky-300 shrink-0">
                    {traderPurchase.price.toLocaleString(language)}{' '}
                    {getTraderCurrency(traderPurchase.trader) === 'seeds'
                      ? t('common.seeds')
                      : getTraderCurrency(traderPurchase.trader) === 'barter'
                        ? t('common.barter')
                        : t('common.coins')}
                  </span>
                </div>

                {traderPurchase.dailyLimit != null && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-200/60 dark:border-sky-800/50 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800/50">
                      {t('traders.dailyLimitNotice', { limit: traderPurchase.dailyLimit })}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"
                      title={t('traders.dailyResetAtUtc')}
                    >
                      <Clock size={11} className="text-gray-400 shrink-0" />
                      <span>{t('traders.dailyResetCountdown', { time: dailyReset.formatted })}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fonti da riciclo di altri oggetti */}
            {recyclingSources.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    {t('itemDetail.howToObtainRecycling')} ({recyclingSources.length})
                  </p>
                  {recyclingSources.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSources(!showAllSources)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {showAllSources ? 'Meno' : `Tutti (${recyclingSources.length})`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {(showAllSources ? recyclingSources : recyclingSources.slice(0, 6)).map(
                    (src: RecyclingSource) => {
                      const srcItem = itemsInfo[src.itemId];
                      const name = srcItem ? getItemName(srcItem, language) : src.itemId;

                      return (
                        <button
                          key={src.itemId}
                          type="button"
                          onClick={() => onSelectItem(src.itemId)}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-left shadow-xs group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {srcItem ? (
                              <ItemCardFrameV2
                                icon={srcItem.icon}
                                alt={name}
                                rarity={srcItem.rarity}
                                itemType={srcItem.item_type}
                                subcategory={srcItem.subcategory}
                                className="w-8 h-8 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-400">
                                ?
                              </div>
                            )}
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono font-bold">
                            {src.recyclesYield != null && src.recyclesYield > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50"
                                title="Rifugio (Riciclo)"
                              >
                                <Home size={10} className="shrink-0 text-blue-500" />
                                <span>×{src.recyclesYield}</span>
                              </span>
                            )}
                            {src.salvagesYield != null && src.salvagesYield > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50"
                                title="In Raid (Smantellamento)"
                              >
                                <Compass size={10} className="shrink-0 text-emerald-600" />
                                <span>×{src.salvagesYield}</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
