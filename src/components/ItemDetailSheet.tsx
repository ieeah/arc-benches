import { useState, useMemo } from "react";
import { Hammer, ShoppingCart, FileJson, Zap } from "lucide-react";
import type { ItemInfo } from "@/types";
import { getRarityStyles, getRarityText } from "@/lib/rarity";
import { getItemCraftStatus, getWorkbenchShortName } from "@/lib/craft";
import { useAppStore } from "@/store";
import { getTraderPurchase, getTraderDisplayName } from "@/lib/traders";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BottomSheet } from "@/components/BottomSheet";
import {
  useTranslation,
  getItemName,
  getItemDescription,
  getRarityLabel,
} from "@/i18n";
import { getBaseItem, getBaseItemForVariant, getProducedItemForBlueprint } from "@/lib/baseItems";

export const ItemDetailSheet = ({
  item: initialItem,
  onClose,
  onOpenOverrides,
}: {
  item: ItemInfo;
  refinerLevel?: number;
  onClose: () => void;
  onOpenOverrides?: (itemId: string) => void;
}) => {
  const [activeItem, setActiveItem] = useState<ItemInfo>(initialItem);
  const [prevInitialItem, setPrevInitialItem] = useState<ItemInfo>(initialItem);

  if (initialItem !== prevInitialItem) {
    setPrevInitialItem(initialItem);
    setActiveItem(initialItem);
  }

  const { t, language } = useTranslation();
  const { glow } = getRarityStyles(activeItem.rarity);
  const currentLevels = useAppStore((s) => s.currentLevels);
  const ownedBlueprints = useAppStore((s) => s.ownedBlueprints);
  const craftMode = useAppStore((s) => s.craftMode);
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const craftResult = getItemCraftStatus(
    activeItem,
    currentLevels,
    ownedBlueprints,
    craftMode,
    itemsInfo,
  );
  const traderPurchase = getTraderPurchase(activeItem.id);
  const displayName = getItemName(activeItem, language);
  const displayDesc = getItemDescription(activeItem, language);

  const isWeapon = activeItem.item_type === 'Weapon' || activeItem.subcategory?.toLowerCase().includes('weapon');
  const isHigherWeaponLevel = isWeapon && /-(ii|iii|iv|v)$/i.test(activeItem.id);
  const isAmplifiedWeapon = isWeapon && (activeItem.rarity === 'Amplified' || /^amplified-/i.test(activeItem.id));
  const isBlueprint =
    activeItem.item_type === 'Blueprint' ||
    activeItem.subcategory === 'Blueprint' ||
    activeItem.id.endsWith('-recipe') ||
    activeItem.id.endsWith('-blueprint');

  // Risoluzione bidirezionale Blueprint -> Oggetto Prodotto (#143 followup)
  const producedItem = useMemo(() => {
    if (!isBlueprint) return undefined;
    return getProducedItemForBlueprint(activeItem.id, itemsInfo);
  }, [isBlueprint, activeItem.id, itemsInfo]);

  // Riconoscimento Base Item e varianti collegate (#143)
  const baseDef = useMemo(() => {
    return getBaseItem(activeItem.id) ?? getBaseItemForVariant(activeItem.id);
  }, [activeItem.id]);

  const variantItems = useMemo(() => {
    if (!baseDef) return [];
    return baseDef.variantItemIds
      .map((id) => itemsInfo[id])
      .filter((i): i is ItemInfo => Boolean(i));
  }, [baseDef, itemsInfo]);

  const blueprintItem = useMemo(() => {
    if (!baseDef?.blueprintItemId) return undefined;
    return itemsInfo[baseDef.blueprintItemId];
  }, [baseDef, itemsInfo]);

  // Suddivisione tra livelli standard (I - IV) e varianti speciali / amplificate
  const { tierVariants, otherVariants } = useMemo(() => {
    const tiers: ItemInfo[] = [];
    const others: ItemInfo[] = [];
    const romanPattern = /-(i|ii|iii|iv|v)$/i;

    for (const v of variantItems) {
      if (romanPattern.test(v.id)) {
        tiers.push(v);
      } else {
        others.push(v);
      }
    }
    return { tierVariants: tiers, otherVariants: others };
  }, [variantItems]);

  return (
    <BottomSheet
      title={displayName}
      onClose={onClose}
      bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-8"
      titleSlot={
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold truncate">{displayName}</h2>
            {import.meta.env.DEV && onOpenOverrides && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOverrides(activeItem.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                title={t("catalog.editInOverrides")}
              >
                <FileJson size={13} />
                <span>Overrides</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p
              className={`text-xs font-bold uppercase tracking-wide ${getRarityText(activeItem.rarity)}`}
            >
              {getRarityLabel(activeItem.rarity, language)}
            </p>
            {activeItem.deprecated && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {language === 'it' ? 'Deprecato' : 'Deprecated'}
              </span>
            )}
          </div>
        </div>
      }
    >
      <ItemCardFrameV2
        icon={activeItem.icon}
        alt={displayName}
        rarity={activeItem.rarity}
        fallbackText={activeItem.id}
        className={`mx-auto w-40 h-40 mb-4 shrink-0 ${glow}`}
        imgClassName="max-w-[95%] max-h-[95%] object-contain"
        categoryBadge={
          <CategoryBadge
            itemType={activeItem.item_type}
            subcategory={activeItem.subcategory}
            bare
          />
        }
      />

      {displayDesc && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {displayDesc}
        </p>
      )}

      {/* Selettore rapido livelli e varianti collegate (#143) */}
      {baseDef && (variantItems.length > 0 || blueprintItem) && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-2.5">
          {/* Pulsante Base Item principale se stiamo guardando una variante */}
          {baseDef.id !== activeItem.id && itemsInfo[baseDef.id] && (
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60 dark:border-gray-700/60">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Base Item
              </span>
              <button
                type="button"
                onClick={() => setActiveItem(itemsInfo[baseDef.id])}
                className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer transition-all"
              >
                ← {getItemName(itemsInfo[baseDef.id], language)}
              </button>
            </div>
          )}

          {/* Livelli standard (I - IV) */}
          {tierVariants.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                {t('itemDetail.familyLevels') || 'Livelli disponibili'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tierVariants.map((tItem) => {
                  const isCurrent = tItem.id === activeItem.id;
                  const match = tItem.id.match(/-(i|ii|iii|iv|v)$/i);
                  const lvlLabel = match ? `Lvl ${match[1].toUpperCase()}` : tItem.name;
                  return (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => setActiveItem(tItem)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {lvlLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Altre varianti (amplificate, mod) */}
          {otherVariants.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                {t('itemDetail.amplifiedVariants') || 'Varianti Speciali & Amplificate'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {otherVariants.map((oItem) => {
                  const isCurrent = oItem.id === activeItem.id;
                  return (
                    <button
                      key={oItem.id}
                      type="button"
                      onClick={() => setActiveItem(oItem)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-black font-bold shadow-sm'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      ⚡ {getItemName(oItem, language)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schema Blueprint collegato */}
          {blueprintItem && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActiveItem(blueprintItem)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeItem.id === blueprintItem.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                }`}
              >
                <span>📜 {getItemName(blueprintItem, language)}</span>
                <span className="text-[10px] uppercase font-bold opacity-80">Blueprint</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigazione inversa: Blueprint -> Oggetto Prodotto (#143 followup) */}
      {producedItem && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60 dark:border-gray-700/60">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t("itemDetail.producedItem")}
            </span>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">
              Blueprint
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveItem(producedItem)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all text-left shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ItemCardFrameV2
                icon={producedItem.icon}
                alt={getItemName(producedItem, language)}
                rarity={producedItem.rarity}
                className="w-8 h-8 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-bold text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {getItemName(producedItem, language)}
                </p>
                <p className="text-[10px] text-gray-400 font-normal truncate">
                  {producedItem.item_type}
                  {producedItem.subcategory ? ` · ${producedItem.subcategory}` : ''}
                </p>
              </div>
            </div>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0 font-bold">
              Visualizza →
            </span>
          </button>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">
            {t("itemDetail.type")}
          </span>
          <span className="font-semibold inline-flex items-center gap-1.5">
            <CategoryBadge
              itemType={activeItem.item_type}
              subcategory={activeItem.subcategory}
              size="xs"
            />
            <span>
              {activeItem.item_type}
              {activeItem.subcategory && activeItem.subcategory !== activeItem.item_type
                ? ` · ${activeItem.subcategory}`
                : ""}
            </span>
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">
            {t("itemDetail.value")}
          </span>
          <span className="font-semibold font-mono">
            {(activeItem.value ?? 0).toLocaleString(language)}
          </span>
        </div>
        {activeItem.stack_size != null && activeItem.stack_size > 1 && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">
              {t("itemDetail.stackSize")}
            </span>
            <span className="font-semibold font-mono">×{activeItem.stack_size}</span>
          </div>
        )}

        {/* Sezione Unificata: Craft e Potenziamenti (#143 followup) */}
        {(craftResult.craftInfo !== null || isHigherWeaponLevel || isAmplifiedWeapon) && (
          <div className="py-2.5 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">
                {t("itemDetail.craftAndUpgrades")}
              </span>
              {/* Se c'è craftResult, mostriamo lo status principale a destra */}
              {craftResult.craftInfo !== null && (
                <span
                  className={`flex items-center gap-1.5 font-semibold text-xs ${
                    craftResult.status === 'craftable' ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  <Hammer size={13} />
                  <span>
                    {craftResult.status === 'craftable'
                      ? (craftResult.craftInfo.workbenchId === 'workbench'
                          ? t("stash.craftableNowBasic")
                          : `${t("stash.craftableNow")} (${getWorkbenchShortName(craftResult.craftInfo.workbenchId, t)} Lvl ${craftResult.craftInfo.levelRequired})`)
                      : craftResult.status === 'needs_project'
                        ? (craftResult.craftInfo.recipeId && itemsInfo[craftResult.craftInfo.recipeId]
                            ? t('stash.requiresBlueprintShort', { name: getItemName(itemsInfo[craftResult.craftInfo.recipeId], language) })
                            : t('stash.requiresBlueprintShort', { name: 'Blueprint' }))
                        : craftResult.craftInfo.workbenchId === 'workbench'
                          ? t('stash.craftableNowBasic')
                          : `${getWorkbenchShortName(craftResult.craftInfo.workbenchId, t)} Lvl ${craftResult.craftInfo.levelRequired}`}
                  </span>
                </span>
              )}
            </div>

            {/* Dettaglio Potenziamento Gunsmith per livelli II-IV */}
            {isHigherWeaponLevel && (
              <div className="flex items-center justify-between text-xs p-2 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl">
                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                  <Hammer size={13} />
                  <span>{t("itemDetail.gunsmithUpgrade")}</span>
                </span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {(() => {
                    const match = activeItem.id.match(/-(ii|iii|iv|v)$/i);
                    return match ? `Gunsmith Lvl ${match[1].toUpperCase() === 'II' ? '2' : match[1].toUpperCase() === 'III' ? '3' : '4'}` : 'Gunsmith';
                  })()}
                </span>
              </div>
            )}

            {/* Dettaglio Amplificazione e Ricerca Research Station */}
            {isAmplifiedWeapon && (
              <div className="text-xs p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                  <Zap size={14} className="shrink-0 text-amber-500" />
                  <span>{t("itemDetail.amplifiedWeaponReq")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600/90 dark:text-amber-400/90 pl-5">
                  <span>🔬</span>
                  <span>{t("itemDetail.researchStationReq")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {traderPurchase !== null && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">{t("itemDetail.shop")}</span>
            <span className="flex items-center gap-1.5 font-semibold text-sky-500 dark:text-sky-400">
              <ShoppingCart size={14} />
              <span>
                {getTraderDisplayName(traderPurchase.trader)} ({traderPurchase.price.toLocaleString(language)} {t("common.coins")})
              </span>
            </span>
          </div>
        )}
        {activeItem.loot_area && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">
              {t("itemDetail.lootArea")}
            </span>
            <span className="font-semibold">{activeItem.loot_area}</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
