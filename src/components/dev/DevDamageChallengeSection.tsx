import { Languages, Plus, RotateCcw, Swords, Trash2 } from 'lucide-react';
import type { List, TieredAction, ActionStep } from '@/types';
import { TieredActionTimeline } from '@/components/TieredActionTimeline';
import { generateUUID } from '@/lib/uuid';

const DEFAULT_EXPEDITION_DAMAGE: TieredAction = {
  id: 'damage-challenge',
  label: 'Damage Requirements',
  translations: { it: { label: 'Danni Richiesti' } },
  steps: [
    { id: 'tier-1', label: '5.000' },
    { id: 'tier-2', label: '10.000' },
    { id: 'tier-3', label: '30.000' },
    { id: 'tier-4', label: '50.000' },
    { id: 'tier-5', label: '100.000' },
  ],
};

interface DevDamageChallengeSectionProps {
  selectedList: List;
  updateSelectedList: (updater: (prev: List) => List) => void;
}

/**
 * Sezione Damage Challenge nell'editor di una spedizione.
 * Permette di personalizzare il titolo e le soglie di danno.
 */
export const DevDamageChallengeSection = ({
  selectedList,
  updateSelectedList,
}: DevDamageChallengeSectionProps) => {
  const currentSteps = selectedList.damageChallenge?.steps ?? DEFAULT_EXPEDITION_DAMAGE.steps;

  const getOrCloneDefault = (prev: List): TieredAction =>
    prev.damageChallenge ?? JSON.parse(JSON.stringify(DEFAULT_EXPEDITION_DAMAGE));

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Swords size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>Damage Challenge (Sfida Danni Spedizione)</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-mono">
                {currentSteps.length} Soglie
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Personalizza il nome e le soglie di danno specifiche per questa spedizione.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            updateSelectedList((prev) => ({
              ...prev,
              damageChallenge: JSON.parse(JSON.stringify(DEFAULT_EXPEDITION_DAMAGE)),
            }))
          }
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          title="Ripristina valori predefiniti"
        >
          <RotateCcw size={13} />
          <span>Ripristina Default</span>
        </button>
      </div>

      {/* Title & Italian Translation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/70 dark:border-gray-700/60 rounded-2xl">
        <div>
          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
            Titolo Sfida EN (Default)
          </label>
          <input
            type="text"
            value={selectedList.damageChallenge?.label ?? DEFAULT_EXPEDITION_DAMAGE.label}
            onChange={(e) => {
              const val = e.target.value;
              updateSelectedList((prev) => {
                const current = getOrCloneDefault(prev);
                return { ...prev, damageChallenge: { ...current, label: val } };
              });
            }}
            placeholder="es. Damage Requirements"
            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-1">
            <Languages size={11} className="text-red-500" />
            Traduzione Titolo (IT)
          </label>
          <input
            type="text"
            value={
              selectedList.damageChallenge?.translations?.it?.label ??
              DEFAULT_EXPEDITION_DAMAGE.translations?.it?.label ??
              ''
            }
            onChange={(e) => {
              const val = e.target.value;
              updateSelectedList((prev) => {
                const current = getOrCloneDefault(prev);
                return {
                  ...prev,
                  damageChallenge: {
                    ...current,
                    translations: {
                      ...(current.translations || {}),
                      it: { ...(current.translations?.it || {}), label: val },
                    },
                  },
                };
              });
            }}
            placeholder="es. Danni Richiesti"
            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold"
          />
        </div>
      </div>

      {/* Thresholds / Steps List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Scaglioni / Soglie Danno</span>
          </label>
          <button
            type="button"
            onClick={() => {
              updateSelectedList((prev) => {
                const current = getOrCloneDefault(prev);
                const steps = [...(current.steps || [])];
                const newStepIdx = steps.length + 1;
                steps.push({
                  id: generateUUID(),
                  label: `${newStepIdx * 25}.000`,
                  translations: { it: { label: `${newStepIdx * 25}.000` } },
                });
                return { ...prev, damageChallenge: { ...current, steps } };
              });
            }}
            className="flex items-center gap-1 px-3 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Plus size={12} />
            <span>Aggiungi Soglia Danno</span>
          </button>
        </div>

        <div className="space-y-2">
          {currentSteps.map((step, sIdx) => (
            <div
              key={step.id || sIdx}
              className="p-2.5 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-2.5"
            >
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-black flex items-center justify-center shrink-0 font-mono">
                {sIdx + 1}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <div>
                  <input
                    type="text"
                    value={step.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSelectedList((prev) => {
                        const current = getOrCloneDefault(prev);
                        const nextSteps = [...(current.steps || [])];
                        nextSteps[sIdx] = { ...nextSteps[sIdx], label: val };
                        return { ...prev, damageChallenge: { ...current, steps: nextSteps } };
                      });
                    }}
                    placeholder="Soglia EN (es. 5.000)"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={step.translations?.it?.label ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSelectedList((prev) => {
                        const current = getOrCloneDefault(prev);
                        const nextSteps = [...(current.steps || [])];
                        nextSteps[sIdx] = {
                          ...nextSteps[sIdx],
                          translations: {
                            ...(nextSteps[sIdx].translations || {}),
                            it: { ...(nextSteps[sIdx].translations?.it || {}), label: val },
                          },
                        };
                        return { ...prev, damageChallenge: { ...current, steps: nextSteps } };
                      });
                    }}
                    placeholder={`Soglia IT (opzionale, default: ${step.label})`}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  updateSelectedList((prev) => {
                    const current = getOrCloneDefault(prev);
                    const nextSteps = (current.steps || []).filter(
                      (_: ActionStep, i: number) => i !== sIdx,
                    );
                    return { ...prev, damageChallenge: { ...current, steps: nextSteps } };
                  });
                }}
                disabled={currentSteps.length <= 1}
                className="w-7 h-7 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                title="Rimuovi soglia"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Timeline Preview */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
          Anteprima Live Timeline Utente
        </span>
        <TieredActionTimeline
          tieredAction={selectedList.damageChallenge ?? DEFAULT_EXPEDITION_DAMAGE}
          listId="expedition-damage"
          levelNum={0}
        />
      </div>
    </div>
  );
};
