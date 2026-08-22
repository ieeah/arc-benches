import { Hammer, FileJson } from "lucide-react";
import type { ItemInfo } from "@/types";
import { getRarityStyles, getRarityText } from "@/lib/rarity";
import { refinerCraftLevel } from "@/lib/craft";
import { ItemCardFrameV2 } from "@/components/ItemCardFrameV2";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BottomSheet } from "@/components/BottomSheet";
import {
  useTranslation,
  getItemName,
  getItemDescription,
  getRarityLabel,
} from "@/i18n";

export const ItemDetailSheet = ({
  item,
  refinerLevel,
  onClose,
  onOpenOverrides,
}: {
  item: ItemInfo;
  refinerLevel: number;
  onClose: () => void;
  onOpenOverrides?: (itemId: string) => void;
}) => {
  const { t, language } = useTranslation();
  const { glow } = getRarityStyles(item.rarity);
  const craftLevel = refinerCraftLevel(item);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
  const displayName = getItemName(item, language);
  const displayDesc = getItemDescription(item, language);

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
                  onOpenOverrides(item.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                title="Modifica in Dev Overrides"
              >
                <FileJson size={13} />
                <span>Overrides</span>
              </button>
            )}
          </div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${getRarityText(item.rarity)}`}
          >
            {getRarityLabel(item.rarity, language)}
          </p>
        </div>
      }
    >
      {/* Prototipo ItemCardFrameV2 (#44 follow-up): rarità come bordo + bagliore d'angolo,
          barra inferiore neutra per l'icona categoria invece del gradiente pieno */}
      <ItemCardFrameV2
        icon={item.icon}
        alt={displayName}
        rarity={item.rarity}
        fallbackText={item.id}
        className={`mx-auto w-40 h-40 mb-4 shrink-0 ${glow}`}
        imgClassName="max-w-[95%] max-h-[95%] object-contain"
        categoryBadge={
          <CategoryBadge
            itemType={item.item_type}
            subcategory={item.subcategory}
            bare
          />
        }
      />

      {displayDesc && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {displayDesc}
        </p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">
            {t("itemDetail.type")}
          </span>
          <span className="font-semibold inline-flex items-center gap-1.5">
            <CategoryBadge
              itemType={item.item_type}
              subcategory={item.subcategory}
              size="xs"
            />
            <span>
              {item.item_type}
              {item.subcategory && item.subcategory !== item.item_type
                ? ` · ${item.subcategory}`
                : ""}
            </span>
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-gray-400 font-medium">
            {t("itemDetail.value")}
          </span>
          <span className="font-semibold font-mono">
            {item.value.toLocaleString(language === "en" ? "en-US" : "it-IT")}
          </span>
        </div>
        {item.stack_size != null && item.stack_size > 1 && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">
              {t("itemDetail.stackSize")}
            </span>
            <span className="font-semibold font-mono">×{item.stack_size}</span>
          </div>
        )}
        {craftLevel !== null && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">Craft</span>
            <span
              className={`flex items-center gap-1.5 font-semibold ${craftableNow ? "text-emerald-500" : "text-amber-500"}`}
            >
              <Hammer size={14} />
              {craftableNow
                ? language === "en"
                  ? "Craftable now"
                  : "Craftabile ora"
                : `Refiner Lvl ${craftLevel}`}
            </span>
          </div>
        )}
        {item.loot_area && (
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 font-medium">
              {t("itemDetail.lootArea")}
            </span>
            <span className="font-semibold">{item.loot_area}</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
