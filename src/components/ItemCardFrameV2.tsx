import React from "react";
import { CheckCircle2 } from "lucide-react";
import { ItemIcon } from "@/components/ItemIcon";
import { getRarityHex } from "@/lib/rarity";
import { iconUrl } from "@/lib/icons";

export type ItemCardFrameV2Props = {
  icon?: string | null;
  alt?: string;
  rarity?: string;
  itemType?: string | null;
  subcategory?: string | null;
  fallbackText?: string;
  className?: string;
  innerClassName?: string;
  imgClassName?: string;
  aspectSquare?: boolean;
  borderRadius?: string | number;
  topLeftSlot?: React.ReactNode;
  topRightSlot?: React.ReactNode;
  /** Icona categoria/sottocategoria, mostrata nella barra inferiore. Ignorata se `compact`. */
  categoryBadge?: React.ReactNode;
  bottomRightSlot?: React.ReactNode;
  /** Testo a destra nella barra inferiore, accanto all'icona categoria (es. «×3» come nel gioco). Ignorato se `compact`. */
  barRightSlot?: React.ReactNode;
  overlay?: React.ReactNode;
  /** Se true, mostra l'overlay standard di completamento con icona check verde ad alto contrasto. */
  completed?: boolean;
  /** Per rendering molto piccoli: nasconde la barra categoria inferiore (badge + spazio riservato). */
  compact?: boolean;
  /** Usa la miniatura 128px dell'icona (righe di lista piccole). */
  thumb?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

type CardBgVariant = "amplified" | "blueprint" | "design" | "default";

const AMPLIFIED_BG =
  "linear-gradient(to top, #F08524 0% 8%, #B46624 8% 16%, #894F26 16% 24%, #693E25 24% 32%, #563427 32%, #1C1A25 100%)";

const DESIGN_GRID_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11 0h2v8h-2zM11 16h2v8h-2zM0 11h8v2H0zM16 11h8v2h-8z" fill="rgb(133 149 177 / 0.18)"/><path d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3z" fill="rgb(133 149 177 / 0.58)"/></svg>`;
const DESIGN_GRID_URI = `url("data:image/svg+xml,${encodeURIComponent(DESIGN_GRID_SVG)}")`;

function resolveCardBgVariant(
  rarity?: string,
  itemType?: string | null,
  subcategory?: string | null,
): CardBgVariant {
  if (rarity?.toLowerCase().trim() === "amplified") return "amplified";
  const normType = itemType?.toLowerCase().trim();
  const normSub = subcategory?.toLowerCase().trim();
  if (normType === "blueprint" || normSub === "blueprint") return "blueprint";
  if (normType === "design" || normSub === "design") return "design";
  return "default";
}

function getContentBackground(
  bgVariant: CardBgVariant,
  hex: string,
): string {
  switch (bgVariant) {
    case "amplified":
      return AMPLIFIED_BG;
    case "blueprint":
      return `url("${iconUrl("blueprint-bg.jpg")}") center / cover no-repeat, #0a0f1e`;
    case "design":
      return `radial-gradient(circle at 0% 100%, ${hex}45 0%, transparent 82%), ${DESIGN_GRID_URI} center / 24px 24px repeat, #182336`;
    default:
      return `radial-gradient(circle at 0% 100%, ${hex}40 0%, transparent 85%)`;
  }
}

/**
 * Frame standard delle card oggetto che replica fedelmente la card di gioco.
 * Struttura a 3 livelli:
 * - container: solo bordo (colore rarità) e border-radius (squircle) — nessuno sfondo.
 * - contenuto: bagliore di rarità (o background dedicato per Amplificati, Blueprint e Design)
 *   come vero `background` CSS, immagine oggetto centrata, badge angolare solido (SVG) in basso a
 *   sinistra — tutto scalato sulla sua sola altezza, la barra è una sorella, non ci rientra.
 * - barra: sfondo trasparente (mostra ciò che sta dietro la card), solo l'icona
 *   categoria (la variante del tema corrente viene scelta da CategoryBadge, senza filtri CSS).
 */
export const ItemCardFrameV2 = ({
  icon,
  alt = "",
  rarity,
  itemType,
  subcategory,
  fallbackText,
  className = "",
  innerClassName = "",
  imgClassName = "max-w-full max-h-full object-contain",
  aspectSquare = true,
  borderRadius,
  topLeftSlot,
  topRightSlot,
  categoryBadge,
  bottomRightSlot,
  barRightSlot,
  overlay,
  completed = false,
  compact = false,
  thumb = false,
  onClick,
  children,
}: ItemCardFrameV2Props) => {
  const hex = getRarityHex(rarity);
  const bgVariant = resolveCardBgVariant(rarity, itemType, subcategory);
  const contentBackground = getContentBackground(bgVariant, hex);
  const showCategoryBar = !compact && Boolean(categoryBadge || barRightSlot);
  const showCornerArc =
    showCategoryBar && bgVariant !== "amplified" && bgVariant !== "blueprint";

  const radiusValue =
    typeof borderRadius === "number"
      ? `${borderRadius}px`
      : (borderRadius ?? "max(6px, calc(var(--card-radius, 24px) - var(--card-padding, 10px)))");

  return (
    <div
      onClick={onClick}
      style={{
        borderColor: hex,
        borderRadius: radiusValue,
      }}
      className={`relative overflow-clip min-h-0 min-w-0 border-2 squircle flex flex-col select-none transition-all ${
        aspectSquare ? "aspect-square" : ""
      } ${onClick ? "cursor-pointer active:scale-95" : ""} ${className}`}
    >
      {/* Contenuto: gradiente come background reale (clippato al suo box, non può
          "sconfinare" nella barra sottostante perché è una sorella nel flex-col) */}
      <div
        style={{
          background: contentBackground,
        }}
        className="relative flex-1 min-h-0 overflow-clip flex items-center justify-center"
      >
        {/* Badge angolare solido della rarità, dentro il box del contenuto */}
        {showCornerArc && (
          <svg
            aria-hidden
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 block pointer-events-none opacity-90"
          >
            <path d="M 0 100 L 0 50 C 0 72 16 100 46 100 Z" fill={hex} />
          </svg>
        )}

        <div
          style={{ padding: 'clamp(2px, 10%, 28px)' }}
          className={`relative w-full h-full flex items-center justify-center ${innerClassName}`}
        >
          <ItemIcon
            icon={icon}
            alt={alt}
            fallbackText={fallbackText}
            imgClassName={imgClassName}
            thumb={thumb}
          />
        </div>

        {topLeftSlot && (
          <div className="absolute top-2.5 left-2 z-10">{topLeftSlot}</div>
        )}

        {topRightSlot && (
          <div className="absolute top-2.5 right-2 z-10">{topRightSlot}</div>
        )}

        {bottomRightSlot && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            {bottomRightSlot}
          </div>
        )}

        {overlay}
        {children}
      </div>

      {/* Barra: sfondo trasparente, solo l'icona — che in tema chiaro va invertita
          (le icone sorgente sono pensate per sfondo scuro). Altezza e padding
          orizzontale entrambi clampati in percentuale (non px fissi): un valore
          assoluto è proporzionalmente enorme su una barra stretta (card piccola) e
          minuscolo su una larga, esattamente il problema segnalato più volte. */}
      {showCategoryBar && (
        <div
          className="shrink-0 flex items-center justify-between gap-1"
          style={{
            height: 'clamp(18px, 24%, 34px)',
            paddingLeft: 'clamp(4px, 6%, 10px)',
            paddingRight: 'clamp(4px, 6%, 10px)',
          }}
        >
          {/* Niente padding verticale fisso (collassava sulle barre piccole, es. card
              da 80px con barra ~19px): il margine è tutto proporzionale, l'icona resta
              al 65% dell'altezza barra a qualunque taglia, non scende mai sotto o sopra
              soglie ragionevoli perché la barra stessa è già clampata (18-34px). */}
          <div className="h-[65%] flex items-center">
            {categoryBadge}
          </div>
          {barRightSlot && (
            <div className="ml-auto flex items-center text-[10px] font-black leading-none text-white tabular-nums">
              {barRightSlot}
            </div>
          )}
        </div>
      )}

      {/* Overlay completato globale a tutta la card (centrato geometricamente su icona + barra) */}
      {completed && (
        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center pointer-events-none z-20 animate-in fade-in zoom-in-90 duration-200">
          <CheckCircle2
            size={32}
            className="text-green-500 bg-white dark:bg-black rounded-full shadow-lg"
          />
        </div>
      )}
    </div>
  );
};
