import { CheckCircle2, Hammer, ClipboardList } from 'lucide-react';
import type { ItemInfo } from '@/types';
import { getRarityStyles, getRarityText } from '@/lib/rarity';
import { refinerCraftLevel } from '@/lib/craft';
import { getLootAreas } from '@/lib/lootArea';
import { ItemCardFrame } from '@/components/ItemCardFrame';
import { BottomSheet } from '@/components/BottomSheet';
import type { ItemListDependency } from '@/store/selectors';
import { useTranslation, getItemName, getItemDescription, getRarityLabel } from '@/i18n';

interface StashItemDetailSheetProps {
  item: ItemInfo;
  owned: number;
  required: number;
  refinerLevel: number;
  dependencies: ItemListDependency[];
  onClose: () => void;
}

export const StashItemDetailSheet = ({
  item,
  owned,
  required,
  refinerLevel,
  dependencies,
  onClose,
}: StashItemDetailSheetProps) => {
  const { language } = useTranslation();
  const { glow } = getRarityStyles(item.rarity);
  const craftLevel = refinerCraftLevel(item);
  const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
  const lootAreas = getLootAreas(item.loot_area, 15);
  const isCompleted = owned >= required;
  const missing = Math.max(0, required - owned);
  const progressPercent = required > 0 ? Math.min(100, Math.round((owned / required) * 100)) : 100;
  const displayName = getItemName(item, language);
  const displayDesc = getItemDescription(item, language);

  return (
    <BottomSheet
      title={displayName}
      onClose={onClose}
      bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-8 space-y-5"
      titleSlot={
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate text-gray-900 dark:text-gray-100">{displayName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-bold uppercase tracking-wide ${getRarityText(item.rarity)}`}>
              {getRarityLabel(item.rarity, language)}
            </span>
            {item.subcategory && (
              <>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {item.subcategory}
                </span>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* ── SEZIONE 1: ICONA HERO PULITA & PROGRESSO INVENTARIO ── */}
      <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60">
        <ItemCardFrame
          icon={item.icon}
          alt={item.name}
          rarity={item.rarity}
          borderRadius={14}
          fallbackText={item.id.replace(/-/g, ' ')}
          className={`w-20 h-20 shrink-0 ${glow}`}
          imgClassName="max-w-full max-h-full object-contain"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-semibold text-gray-500">Stato Stash</span>
            <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
              {owned} / {required}
            </span>
          </div>

          {/* Barra di avanzamento */}
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-500">
                <CheckCircle2 size={13} /> Fabbisogno Completato
              </span>
            ) : (
              <span className="font-bold text-amber-500">
                Mancano {missing} unità
              </span>
            )}
            <span className="text-gray-400 font-mono">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* ── SEZIONE 2: FABBRICAZIONE NEL REFINER (se craftabile) ── */}
      {craftLevel !== null && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg ${
                craftableNow
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Hammer size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Fabbricabile nel Refiner
              </p>
              <p className="text-[11px] text-gray-500">
                Richiede Refiner Livello {craftLevel} (attuale: Lvl {refinerLevel})
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
              craftableNow
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            {craftableNow ? 'Disponibile' : 'Bloccato'}
          </span>
        </div>
      )}

      {/* ── SEZIONE 3: ZONE DI LOOT & PROVENIENZA ── */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Zone di Loot & Ritrovamento
        </h3>
        {lootAreas.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {lootAreas.map((area, idx) => (
              <div
                key={`${area.id}-${idx}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50"
              >
                <div className="p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-2xs">
                  {area.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                    {area.label}
                  </p>
                  <p className="text-[10px] text-gray-400">Container / Mappa</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-400 italic">
            Nessuna zona di loot specifica indicata.
          </div>
        )}
      </div>

      {/* ── SEZIONE 4: FABBISOGNO DETTAGLIATO PER BANCO / LISTA ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Richiesto da Banchi & Liste ({dependencies.length})
          </h3>
          <span className="text-xs font-mono font-semibold text-gray-400">
            Totale: {required}
          </span>
        </div>

        {dependencies.length > 0 ? (
          <div className="space-y-2">
            {dependencies.map((dep, idx) => (
              <div
                key={`${dep.listId}-${dep.level}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      dep.isCustom
                        ? 'bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {dep.isCustom ? <ClipboardList size={16} /> : <Hammer size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {dep.listName}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold">
                      Livello {dep.level}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    ×{dep.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-400 italic">
            Nessun banco o lista ha questo materiale tra i target attivi.
          </div>
        )}
      </div>

      {/* ── SEZIONE 5: DESCRIZIONE & LORE (se disponibile) ── */}
      {displayDesc && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Descrizione
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {displayDesc}
          </p>
        </div>
      )}
    </BottomSheet>
  );
};
