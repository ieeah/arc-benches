import { Plus, Minus } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { getRarityHex } from "@/lib/rarity";

export interface QuantityStepperProps {
  tempValue: string;
  onTempValueChange: (val: string) => void;
  onBlur: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  rarity?: string;
  orientation?: "horizontal" | "vertical";
  itemName?: string;
  className?: string;
}

export const QuantityStepper = ({
  tempValue,
  onTempValueChange,
  onBlur,
  onIncrement,
  onDecrement,
  rarity,
  orientation = "horizontal",
  itemName,
  className = "",
}: QuantityStepperProps) => {
  const longPressInc = useLongPress(onIncrement);
  const longPressDec = useLongPress(onDecrement);

  const hex = getRarityHex(rarity);
  const backgroundColor = hex ? `${hex}40` : undefined;
  const borderColor = hex ? `${hex}80` : undefined;

  const isVertical = orientation === "vertical";

  return (
    <div
      style={{
        backgroundColor,
        borderColor,
      }}
      className={`border concentric-inner squircle p-0.5 shadow-2xs transition-colors ${
        !hex
          ? "bg-gray-100 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700"
          : ""
      } ${
        isVertical
          ? "flex flex-col items-center shrink-0"
          : "flex items-center w-full"
      } ${className}`}
    >
      {/* ── SE ORIZZONTALE: - SX, INPUT CENTRO, + DX ── */}
      {/* ── SE VERTICALE: + TOP, INPUT CENTRO, - BOTTOM ── */}
      {isVertical ? (
        <>
          <button
            type="button"
            onContextMenu={(e) => e.preventDefault()}
            onClick={onIncrement}
            {...longPressInc}
            aria-label={`Aumenta quantità ${itemName ?? "oggetto"}`}
            className="w-8 h-7 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg active:scale-90 transition-all shrink-0 font-bold"
          >
            <Plus size={14} />
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={tempValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                onTempValueChange(val);
              }
            }}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className="w-8 h-6 text-center font-bold bg-transparent text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-md text-gray-900 dark:text-white"
          />

          <button
            type="button"
            onContextMenu={(e) => e.preventDefault()}
            onClick={onDecrement}
            {...longPressDec}
            aria-label={`Riduci quantità ${itemName ?? "oggetto"}`}
            className="w-8 h-7 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg active:scale-90 transition-all shrink-0 font-bold"
          >
            <Minus size={14} />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onContextMenu={(e) => e.preventDefault()}
            onClick={onDecrement}
            {...longPressDec}
            aria-label={`Riduci quantità ${itemName ?? "oggetto"}`}
            className="w-8 h-7 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg active:scale-90 transition-all shrink-0 font-bold"
          >
            <Minus size={14} />
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={tempValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d+$/.test(val)) {
                onTempValueChange(val);
              }
            }}
            onBlur={onBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            className="w-0 flex-1 h-7 text-center font-bold font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-md text-xs text-gray-900 dark:text-white"
          />

          <button
            type="button"
            onContextMenu={(e) => e.preventDefault()}
            onClick={onIncrement}
            {...longPressInc}
            aria-label={`Aumenta quantità ${itemName ?? "oggetto"}`}
            className="w-8 h-7 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg active:scale-90 transition-all shrink-0 font-bold"
          >
            <Plus size={14} />
          </button>
        </>
      )}
    </div>
  );
};
