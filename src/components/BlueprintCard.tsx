import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { ItemIcon } from '@/components/ItemIcon';
import { iconUrl } from '@/lib/icons';
import { getCategoryIconPath } from '@/lib/categoryIcons';
import { useTranslation, getItemName } from '@/i18n';

type BlueprintCardProps = {
  blueprint: ItemInfo;
  isOwned: boolean;
  onToggleOwned: () => void;
  /** Opzionale per futura integrazione Vault Spedizione (Issue #34) */
  onAddToVault?: () => void;
  showVaultAction?: boolean;
};

export const BlueprintCard = ({
  blueprint,
  isOwned,
  onToggleOwned,
  onAddToVault,
  showVaultAction = false,
}: BlueprintCardProps) => {
  const { t, language } = useTranslation();
  const displayName = getItemName(blueprint, language);

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
      className={`flex flex-col transition-all cursor-pointer select-none active:scale-[0.98] group ${
        isOwned ? 'opacity-50 grayscale-[0.35]' : 'hover:scale-[1.02]'
      }`}
    >
      {/* Container Icona con Background Blueprint di gioco */}
      <div className="relative aspect-square min-h-0 rounded-[18px] overflow-clip bg-gray-950 flex flex-col border-2 border-blue-400/40 shadow-xs">
        {/* Background Blueprint originale */}
        <img
          src={iconUrl('blueprint-bg.jpg')}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Icona dell'oggetto centrata sulla griglia (sopra la barra) */}
        <div className="relative z-1 flex-1 min-h-0 flex items-center justify-center p-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center drop-shadow-md">
            <ItemIcon
              icon={blueprint.icon}
              alt={displayName}
              fallbackText={blueprint.id.replace(/-/g, ' ')}
              imgClassName="max-w-full max-h-full object-contain scale-[1.25]"
            />
          </div>
        </div>

        {/* Barra scura opaca con l'icona dei progetti, come nell'inventario di gioco. */}
        <div
          className="relative z-1 shrink-0 px-2.5 flex items-center bg-[#0a0f1e]"
          style={{ height: 'clamp(26px, 18%, 34px)' }}
        >
          <img
            src={getCategoryIconPath('Blueprint')!}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-[65%] w-auto object-contain select-none pointer-events-none"
          />
        </div>

        {/* Checkmark verde quando posseduto */}
        {isOwned && (
          <div className="absolute inset-0 z-2 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <CheckCircle2 size={32} className="text-emerald-400 bg-black/80 rounded-full shadow-lg p-0.5 border border-emerald-500/40" />
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
            title={t('blueprints.addToVault')}
            aria-label={t('blueprints.addToVault')}
          >
            <ShieldAlert size={14} className="text-blue-400" />
          </button>
        )}
      </div>

      {/* Nome pulito sotto l'icona */}
      <div className="min-w-0 text-center pt-1.5 px-0.5">
        <h4 className="text-xs sm:text-[13px] font-semibold truncate leading-tight text-gray-800 dark:text-gray-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
          {displayName}
        </h4>
      </div>
    </div>
  );
};
