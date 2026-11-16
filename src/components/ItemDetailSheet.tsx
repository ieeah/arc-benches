import { useState, useMemo } from "react";
import { FileJson, Zap, FileText, ArrowLeft } from "lucide-react";
import type { ItemInfo } from "@/types";
import { getRarityStyles, getRarityText } from "@/lib/rarity";
import { useAppStore } from "@/store";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BottomSheet } from "@/components/BottomSheet";
import {
  useTranslation,
  getItemName,
  getItemDescription,
  getRarityLabel,
} from "@/i18n";
import {
  getBaseItem,
  getBaseItemForVariant,
  getProducedItemForBlueprint,
  baseItemToItemInfo,
} from "@/lib/baseItems";
import { ItemRecipeDetails } from "@/components/ItemRecipeDetails";

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
  const itemsInfo = useAppStore((s) => s.itemsInfo);

  // Se l'oggetto iniziale è un Base Item astratto, apri di default il suo Livello 1 (es. anvil -> anvil-i)
  const resolvedInitial = useMemo(() => {
    const bDef = getBaseItem(initialItem.id);
    if (bDef && bDef.variantItemIds?.length) {
      const tier1Id =
        bDef.variantItemIds.find((v) => v === bDef.id + '-i' || v.endsWith('-i')) ||
        bDef.variantItemIds[0];
      if (tier1Id && itemsInfo[tier1Id]) {
        return itemsInfo[tier1Id];
      }
    }
    return initialItem;
  }, [initialItem, itemsInfo]);

  const [history, setHistory] = useState<ItemInfo[]>([resolvedInitial]);
  const [prevInitialId, setPrevInitialId] = useState<string>(initialItem.id);

  if (initialItem.id !== prevInitialId) {
    setPrevInitialId(initialItem.id);
    setHistory([resolvedInitial]);
  }

  const activeItem = history[history.length - 1];
  const prevItem = history.length > 1 ? history[history.length - 2] : null;

  const navigateTo = (next: ItemInfo) => {
    setHistory((prev) => [...prev, next]);
  };

  const handleBack = () => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const { t, language } = useTranslation();
  const { glow } = getRarityStyles(activeItem.rarity);
  const displayName = getItemName(activeItem, language);
  const displayDesc = getItemDescription(activeItem, language);

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
                {t('common.deprecated')}
              </span>
            )}
          </div>
        </div>
      }
    >
      {/* ── BARRA CRONOLOGIA NAVIGAZIONE A RITROSO ── */}
      {prevItem && (
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-2xs group"
          >
            <ArrowLeft size={13} className="text-blue-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t('itemDetail.backTo', { name: getItemName(prevItem, language) })}</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-gray-400">
            {t('itemDetail.historyStep', { current: history.length, total: history.length })}
          </span>
        </div>
      )}

      {/* ── SELETTORE STICKY DEI LIVELLI & PANORAMICA ── */}
      {baseDef && (variantItems.length > 0 || blueprintItem) && (
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs py-2.5 border-b border-gray-200/70 dark:border-gray-800 -mx-5 px-5 mb-4 space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* Pill Panoramica Famiglia */}
            <button
              type="button"
              onClick={() => navigateTo(baseItemToItemInfo(baseDef))}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeItem.id === baseDef.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60'
              }`}
            >
              {t('itemDetail.overview')}
            </button>

            {/* Livelli standard (Lvl I, II, III, IV) */}
            {tierVariants.map((tItem) => {
              const isCurrent = tItem.id === activeItem.id;
              const match = tItem.id.match(/-(i|ii|iii|iv|v)$/i);
              const lvlLabel = match ? `Lvl ${match[1].toUpperCase()}` : tItem.name;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => navigateTo(tItem)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {lvlLabel}
                </button>
              );
            })}

            {/* Varianti speciali / amplificate */}
            {otherVariants.map((oItem) => {
              const isCurrent = oItem.id === activeItem.id;
              return (
                <button
                  key={oItem.id}
                  type="button"
                  onClick={() => navigateTo(oItem)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Zap size={11} className="text-amber-500 shrink-0" />
                    <span>{getItemName(oItem, language)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Schema Blueprint collegato */}
          {blueprintItem && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => navigateTo(blueprintItem)}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeItem.id === blueprintItem.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <FileText size={12} className="text-sky-500 shrink-0" />
                  <span className="truncate">{getItemName(blueprintItem, language)}</span>
                </span>
                <span className="text-[10px] uppercase font-bold opacity-80 shrink-0 ml-2">Blueprint</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CARD HERO OGGETTO ── */}
      <ItemCardFrameV2
        icon={activeItem.icon}
        alt={displayName}
        rarity={activeItem.rarity}
        itemType={activeItem.item_type}
        subcategory={activeItem.subcategory}
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
            onClick={() => navigateTo(producedItem)}
            className="w-full flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all text-left shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ItemCardFrameV2
                icon={producedItem.icon}
                alt={getItemName(producedItem, language)}
                rarity={producedItem.rarity}
                itemType={producedItem.item_type}
                subcategory={producedItem.subcategory}
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

      {/* Metadati di Base */}
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
      </div>

      {/* Dettagli Fabbricazione, Potenziamenti, Riparazione, Riciclo e Come Ottenerlo */}
      <ItemRecipeDetails
        item={activeItem}
        baseDef={baseDef}
        onSelectItem={(id) => {
          const it = itemsInfo[id];
          if (it) navigateTo(it);
        }}
      />
    </BottomSheet>
  );
};
