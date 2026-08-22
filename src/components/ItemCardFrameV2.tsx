import React from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { getRarityHex } from "@/lib/rarity";

export interface ItemCardFrameV2Props {
  icon?: string | null;
  alt?: string;
  rarity?: string;
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
  overlay?: React.ReactNode;
  /** Per rendering molto piccoli: nasconde la barra categoria inferiore (badge + spazio riservato). */
  compact?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Variante sperimentale di ItemCardFrame che replica più da vicino la card di gioco.
 * Struttura a 3 livelli:
 * - container: solo bordo (colore rarità) e border-radius (squircle) — nessuno sfondo.
 * - contenuto: bagliore di rarità come vero `background` CSS (non un layer assoluto
 *   separato), immagine oggetto centrata, badge angolare solido (SVG) in basso a
 *   sinistra — tutto scalato sulla sua sola altezza, la barra è una sorella, non ci
 *   rientra.
 * - barra: sfondo trasparente (mostra ciò che sta dietro la card), solo l'icona
 *   categoria, che si inverte in tema chiaro (le icone sorgente sono chiare).
 *
 * Non sostituisce ItemCardFrame — coesistono per confronto visivo.
 */
export const ItemCardFrameV2 = ({
  icon,
  alt = "",
  rarity,
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
  overlay,
  compact = false,
  onClick,
  children,
}: ItemCardFrameV2Props) => {
  const hex = getRarityHex(rarity);
  const showCategoryBar = !compact && Boolean(categoryBadge);

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
      className={`relative overflow-hidden border-2 squircle flex flex-col select-none transition-all ${
        aspectSquare ? "aspect-square" : ""
      } ${onClick ? "cursor-pointer active:scale-95" : ""} ${className}`}
    >
      {/* Contenuto: gradiente come background reale (clippato al suo box, non può
          "sconfinare" nella barra sottostante perché è una sorella nel flex-col) */}
      <div
        style={{
          background: `radial-gradient(circle at 0% 100%, ${hex}40 0%, transparent 85%)`,
        }}
        className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center"
      >
        {/* Badge angolare solido della rarità, dentro il box del contenuto */}
        {showCategoryBar && (
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
          className="shrink-0 flex items-center"
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
          <div className="h-[65%] flex items-center [&_img]:invert dark:[&_img]:invert-0">
            {categoryBadge}
          </div>
        </div>
      )}
    </div>
  );
};
