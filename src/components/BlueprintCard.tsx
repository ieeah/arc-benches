import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { ItemIcon } from '@/components/ItemIcon';
import { iconUrl } from '@/lib/icons';

interface BlueprintCardProps {
  blueprint: ItemInfo;
  isOwned: boolean;
  onToggleOwned: () => void;
  /** Opzionale per futura integrazione Vault Spedizione (Issue #34) */
  onAddToVault?: () => void;
  showVaultAction?: boolean;
}

export const BlueprintCard = ({
  blueprint,
  isOwned,
  onToggleOwned,
  onAddToVault,
  showVaultAction = false,
}: BlueprintCardProps) => {
  return (
    <div
      onClick={onToggleOwned}
      role="checkbox"
      aria-checked={isOwned}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onToggleOwned();
        }
      }}
      className={`flex flex-col p-2.5 rounded-[28px] border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all cursor-pointer select-none active:scale-[0.98] ${
        isOwned ? 'opacity-45 grayscale-[0.4]' : 'hover:border-blue-300 dark:hover:border-blue-600 shadow-xs'
      }`}
    >
      {/* Container Icona con Background Blueprint di gioco */}
      <div className="relative mb-2 aspect-square rounded-[10px] overflow-hidden bg-gray-950 flex items-center justify-center">
        {/* Background Blueprint originale */}
        <img
          src={iconUrl('blueprint-bg.jpg')}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover scale-[1.04] select-none pointer-events-none"
        />

        {/* Icona dell'oggetto posizionata sopra la griglia blu */}
        <div className="relative z-1 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center -translate-y-2.5 drop-shadow-md">
          <ItemIcon
            icon={blueprint.icon}
            alt={blueprint.name}
            fallbackText={blueprint.id.replace(/-/g, ' ')}
            imgClassName="max-w-full max-h-full object-contain scale-[1.15]"
          />
        </div>

        {/* Checkmark verde quando posseduto */}
        {isOwned && (
          <div className="absolute inset-0 z-2 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <CheckCircle2 size={28} className="text-emerald-400 bg-black/80 rounded-full shadow-lg p-0.5 border border-emerald-500/40" />
          </div>
        )}

        {/* Pulsante Vault Spedizione (predisposto per Issue #34, nascosto di default) */}
        {showVaultAction && onAddToVault && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToVault();
            }}
            className="absolute top-2 right-2 z-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-95 transition-all"
            title="Aggiungi al Vault Spedizione"
            aria-label="Aggiungi al Vault Spedizione"
          >
            <ShieldAlert size={14} className="text-amber-400" />
          </button>
        )}
      </div>

      {/* Titolo e Dettagli */}
      <div className="flex-1 min-w-0 text-center flex flex-col justify-center py-1">
        <h4 className="text-[13px] sm:text-sm font-bold truncate capitalize leading-tight">
          {blueprint.name.replace(/\s*Blueprint\s*/i, '')}
        </h4>
      </div>
    </div>
  );
};
