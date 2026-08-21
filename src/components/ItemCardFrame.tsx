import React from "react";
import { ItemIcon } from "@/components/ItemIcon";
import { getRarityHex, getRarityGradient } from "@/lib/rarity";
import { useTheme } from "@/context/ThemeContext";

export interface ItemCardFrameProps {
  icon?: string | null;
  alt?: string;
  rarity?: string;
  fallbackText?: string;
  className?: string;
  innerClassName?: string;
  imgClassName?: string;
  aspectSquare?: boolean;
  isCompleted?: boolean;
  borderRadius?: string | number;
  topLeftSlot?: React.ReactNode;
  topRightSlot?: React.ReactNode;
  bottomLeftSlot?: React.ReactNode;
  bottomRightSlot?: React.ReactNode;
  overlay?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const ItemCardFrame = ({
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
  bottomLeftSlot,
  bottomRightSlot,
  overlay,
  onClick,
  children,
}: ItemCardFrameProps) => {
  const { dark } = useTheme();
  const hex = getRarityHex(rarity);
  const gradient = getRarityGradient(rarity, dark);

  const radiusValue =
    typeof borderRadius === "number"
      ? `${borderRadius}px`
      : (borderRadius ?? "max(6px, calc(var(--card-radius, 24px) - var(--card-padding, 10px)))");

  return (
    <div
      onClick={onClick}
      style={{
        background: gradient,
        borderColor: hex,
        borderRadius: radiusValue,
      }}
      className={`relative overflow-hidden border-2 squircle flex items-center justify-center select-none transition-all ${
        aspectSquare ? "aspect-square" : ""
      } ${onClick ? "cursor-pointer active:scale-95" : ""} ${className}`}
    >
      {/* Artwork centrato e leggermente spostato verso l'alto per dare respiro ai badge inferiori */}
      <div
        style={{ padding: 'clamp(3px, 18%, 38px)' }}
        className={`w-full h-full flex items-center justify-center -translate-y-1 ${innerClassName}`}
      >
        <ItemIcon
          icon={icon}
          alt={alt}
          fallbackText={fallbackText}
          imgClassName={imgClassName}
        />
      </div>

      {/* Slot in alto a sinistra (es. Refiner) */}
      {topLeftSlot && (
        <div className="absolute top-2.5 left-2 z-10">{topLeftSlot}</div>
      )}

      {/* Slot in alto a destra */}
      {topRightSlot && (
        <div className="absolute top-2.5 right-2 z-10">{topRightSlot}</div>
      )}

      {/* Slot in basso a sinistra (predisposto per icona categoria / tipo oggetto #9) */}
      {bottomLeftSlot && (
        <div className="absolute bottom-2.5 left-2.5 z-10">
          {bottomLeftSlot}
        </div>
      )}

      {/* Slot in basso a destra (riservato per badge futuri) */}
      {bottomRightSlot && (
        <div className="absolute bottom-2.5 right-2.5 z-10">
          {bottomRightSlot}
        </div>
      )}

      {/* Overlay opzionale (es. Checkmark completamento) */}
      {overlay}

      {/* Extra children opzionali */}
      {children}

      {/* Striscia proporzionale in basso del colore della rarità */}
      <div
        style={{
          backgroundColor: hex,
          height: 'clamp(3px, 8.5%, 18px)',
        }}
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
      />
    </div>
  );
};
