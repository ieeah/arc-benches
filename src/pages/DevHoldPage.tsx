import { useState, useEffect } from 'react';
import {
  Timer,
  RotateCcw,
  Sparkles,
  Touchpad,
  Hash,
  CheckCircle2,
  Sliders,
  Smartphone,
  Eye,
  Info,
} from 'lucide-react';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';
import {
  useHoldConfig,
  setHoldConfigOverride,
  resetHoldConfigOverride,
  type HoldConfig,
} from '@/lib/holdConfig';
import { useRetainedItems } from '@/hooks/useRetainedItems';
import { InventoryCard } from '@/components/InventoryCard';
import type { ItemInfo } from '@/types';

type DevHoldPageProps = {
  onBack: () => void;
};

// Dati dell'oggetto reale 'arc-circuitry' (Circuito ARC)
const SAMPLE_ITEM_INFO: ItemInfo = {
  id: 'arc-circuitry',
  name: 'ARC Circuitry',
  description: 'Obtained from ARC enemies or activities. Used to craft components.',
  icon: 'icons/items/arc-circuitry.webp',
  rarity: 'Rare',
  item_type: 'Topside Material',
  subcategory: null,
  value: 1000,
  workbench: 'Refiner II',
  loot_area: 'ARC',
  stack_size: 5,
  translations: {
    it: {
      name: 'Circuito ARC',
      description: 'Ottenuto da nemici ARC o attività. Si usa per creare componenti.',
    },
  },
};

export function DevHoldPage({ onBack }: DevHoldPageProps) {
  const globalConfig = useHoldConfig();

  // Stato locale sincrono per reattività immediata al 100% degli slider senza lag di localStorage
  const [localConfig, setLocalConfig] = useState<HoldConfig>(globalConfig);

  // Sincronizza stato locale se la configurazione globale cambia dall'esterno o da reset
  useEffect(() => {
    setLocalConfig(globalConfig);
  }, [globalConfig]);

  // Stato per la card di prova (owned / required)
  const [owned, setOwned] = useState<number>(1);
  const [lastCompletedSource, setLastCompletedSource] = useState<'hold' | 'stepper'>('hold');
  const required = 3;
  const isCompleted = owned >= required;

  // useRetainedItems collegato alla card con la configurazione locale reattiva al 100%
  const retained = useRetainedItems(
    [{ id: 'playground-item', isCompleted }],
    { config: localConfig }
  );

  const itemIsRetained = retained.isRetained('playground-item');
  const itemIsExiting = retained.isExiting('playground-item');

  const handleIncrement = () => {
    const next = owned + 1;
    if (!isCompleted && next >= required) {
      setLastCompletedSource('stepper');
      retained.markRetained('playground-item', 'stepper');
    }
    setOwned(next);
  };

  const handleDecrement = () => {
    const next = Math.max(0, owned - 1);
    if (isCompleted && next < required) {
      retained.cancelRetained('playground-item');
    }
    setOwned(next);
  };

  const handleSet = (val: number) => {
    const clamped = Math.max(0, val);
    if (!isCompleted && clamped >= required) {
      setLastCompletedSource('stepper');
      retained.markRetained('playground-item', 'stepper');
    } else if (isCompleted && clamped < required) {
      retained.cancelRetained('playground-item');
    }
    setOwned(clamped);
  };

  // Funzioni di aggiornamento configurazione: sincrone e immediate su override globale e locale
  const updateConfig = (patch: Partial<HoldConfig>) => {
    setLocalConfig(prev => {
      const next = { ...prev, ...patch };
      setHoldConfigOverride(next);
      return next;
    });
  };

  const updateHoldExit = (patch: Partial<HoldConfig['holdExit']>) => {
    setLocalConfig(prev => {
      const next = {
        ...prev,
        holdExit: {
          ...prev.holdExit,
          ...patch,
        },
      };
      setHoldConfigOverride(next);
      return next;
    });
  };

  const updateStepperExit = (patch: Partial<HoldConfig['stepperExit']>) => {
    setLocalConfig(prev => {
      const next = {
        ...prev,
        stepperExit: {
          ...prev.stepperExit,
          ...patch,
        },
      };
      setHoldConfigOverride(next);
      return next;
    });
  };

  const totalHoldExitMs = localConfig.holdExit.feedbackMs + localConfig.holdExit.settleMs + localConfig.holdExit.fadeMs;
  const totalStepperExitMs = localConfig.stepperExit.feedbackMs + localConfig.stepperExit.settleMs + localConfig.stepperExit.fadeMs;

  return (
    <DevStudioLayout
      title="Tempi Interazioni & Uscita"
      subtitle="Calibrazione fine Hold-to-Complete, Stepper e dissolvenze visive su due assi"
      icon={<Timer size={22} className="text-amber-500" />}
      onBack={onBack}
      headerActions={
        <div className="flex items-center gap-2">
          <ApplyToProjectButton artifactIds={['hold-config']} />
          <button
            type="button"
            onClick={() => {
              resetHoldConfigOverride();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Ripristina valori predefiniti di fabbrica"
          >
            <RotateCcw size={14} />
            <span>Ripristina Default</span>
          </button>
        </div>
      }
      sidebar={
        <div className="p-4 space-y-6 text-sm h-full overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Touchpad size={14} className="text-blue-500" />
              <span>Gesto di Pressione (Hold)</span>
            </div>
            <div className="space-y-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-3.5 rounded-xl shadow-xs">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Zona Morta (Deadzone)</span>
                  <span className="font-mono font-bold text-gray-600 dark:text-gray-300">{localConfig.deadzoneMs} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="10"
                  value={localConfig.deadzoneMs}
                  onInput={(e) => updateConfig({ deadzoneMs: Number((e.target as HTMLInputElement).value) })}
                  onChange={(e) => updateConfig({ deadzoneMs: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Tempo minimo prima che la barra progredisca</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Hold Completa</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{localConfig.completeDurationMs} ms</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="25"
                  value={localConfig.completeDurationMs}
                  onInput={(e) => updateConfig({ completeDurationMs: Number((e.target as HTMLInputElement).value) })}
                  onChange={(e) => updateConfig({ completeDurationMs: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Pressione continua per completare</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Hold Annulla</span>
                  <span className="font-mono font-bold text-rose-500">{localConfig.uncompleteDurationMs} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="25"
                  value={localConfig.uncompleteDurationMs}
                  onInput={(e) => updateConfig({ uncompleteDurationMs: Number((e.target as HTMLInputElement).value) })}
                  onChange={(e) => updateConfig({ uncompleteDurationMs: Number(e.target.value) })}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Pressione per azzerare e riportare a 0</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Tolleranza Touch Move</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{localConfig.touchMoveThresholdPx} px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={localConfig.touchMoveThresholdPx}
                  onInput={(e) => updateConfig({ touchMoveThresholdPx: Number((e.target as HTMLInputElement).value) })}
                  onChange={(e) => updateConfig({ touchMoveThresholdPx: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400">Soglia scorrimento per non abortire lo scroll</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info size={14} />
              <span>Override Reattivo</span>
            </div>
            <p>
              I valori modificati hanno effetto in tempo reale sia nella card qui a destra sia
              in tutta l&apos;applicazione (Stash, Raid, Liste).
            </p>
          </div>
        </div>
      }
      previewTitle="Card Reale (InventoryCard)"
      previewIcon={<Smartphone size={16} className="text-emerald-500" />}
      previewBadge={
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
          {itemIsRetained ? (itemIsExiting ? 'fade-out' : 'grace-active') : (isCompleted ? 'completato' : 'incompleto')}
        </span>
      }
      previewContent={
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          <div className="text-center max-w-sm">
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Card di Gioco Ufficiale</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              È l&apos;esatto componente <code className="text-emerald-600 dark:text-emerald-400">InventoryCard</code> con logica di hold sull&apos;icona e stepper numerico.
            </p>
          </div>

          {/* Wrapper con transizione d'uscita fluida e unmount simulato come nello Stash reale */}
          {isCompleted && !itemIsRetained ? (
            <div className="w-48 h-56 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Rimosso dallo Stash
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                L'animazione è terminata e l'elemento è uscito dal DOM.
              </p>
              <button
                type="button"
                onClick={() => {
                  retained.cancelRetained('playground-item');
                  setOwned(0);
                }}
                className="mt-2 px-3 py-1 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Ripristina (0/{required})
              </button>
            </div>
          ) : (
            <div
              className={`w-48 transition-all ease-out ${
                itemIsExiting
                  ? 'opacity-0 scale-90 pointer-events-none'
                  : 'opacity-100 scale-100'
              }`}
              style={{
                transitionDuration: `${
                  itemIsExiting
                    ? (lastCompletedSource === 'stepper' ? localConfig.stepperExit.fadeMs : localConfig.holdExit.fadeMs)
                    : 150
                }ms`,
              }}
            >
              <InventoryCard
                itemId="arc-circuitry"
                owned={owned}
                required={required}
                itemInfo={SAMPLE_ITEM_INFO}
                refinerLevel={2}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onSet={handleSet}
                isExiting={itemIsExiting}
                onHoldStart={() => {
                  setLastCompletedSource('hold');
                  retained.handleHoldStart('playground-item');
                }}
                onHoldEnd={() => retained.handleHoldEnd('playground-item')}
                holdConfig={localConfig}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <div className="flex items-center justify-between text-xs font-mono text-gray-500 px-1">
              <span>Stato: <strong>{owned}/{required}</strong></span>
              <span>Retained: <strong>{itemIsRetained ? 'SÌ' : 'NO'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  retained.cancelRetained('playground-item');
                  setOwned(0);
                }}
                className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer"
              >
                Azzera (0/{required})
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSet(required);
                }}
                className="flex-1 py-1.5 text-xs rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                Completa ({required}/{required})
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-8 max-w-4xl">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sliders size={18} className="text-amber-500" />
            <span>Fasi Visive di Uscita per Sorgente</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Modifica i tempi e prova immediatamente il comportamento tenendo premuta l&apos;icona o usando lo stepper nella card di destra.
          </p>
        </div>

        {/* ASSE 1: Hold-to-Complete Exit */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Touchpad size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Uscita da Pressione Prolungata (Hold Exit)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Scatenata dal rilascio della pressione continua sull&apos;icona dell&apos;oggetto.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                Totale: {totalHoldExitMs} ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Phase 1: Feedback */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span>1. Feedback / Burst</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.holdExit.feedbackMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={localConfig.holdExit.feedbackMs}
                onInput={(e) => updateHoldExit({ feedbackMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateHoldExit({ feedbackMs: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Bagliore verde neon e onde d&apos;urto attive.
              </p>
            </div>

            {/* Phase 2: Settle */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-500" />
                  <span>2. Lettura / Settle</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.holdExit.settleMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1200"
                step="25"
                value={localConfig.holdExit.settleMs}
                onInput={(e) => updateHoldExit({ settleMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateHoldExit({ settleMs: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Pausa di lettura con icona verde visibile prima di svanire.
              </p>
            </div>

            {/* Phase 3: Fade */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <span>3. Dissolvenza (Fade)</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.holdExit.fadeMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={localConfig.holdExit.fadeMs}
                onInput={(e) => updateHoldExit({ fadeMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateHoldExit({ fadeMs: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Transizione CSS opacity/scale prima del collasso.
              </p>
            </div>
          </div>
        </div>

        {/* ASSE 2: Stepper Exit */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Hash size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Uscita da Stepper Numerico (+/input)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Scatenata dal tocco singolo sul pulsante &quot;+&quot; o inserimento da tastiera.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Totale: {totalStepperExitMs} ms
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Phase 1: Feedback */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span>1. Feedback / Burst</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.stepperExit.feedbackMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={localConfig.stepperExit.feedbackMs}
                onInput={(e) => updateStepperExit({ feedbackMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateStepperExit({ feedbackMs: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Effetto flash immediato sul tocco dello stepper.
              </p>
            </div>

            {/* Phase 2: Settle */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-500" />
                  <span>2. Lettura / Settle</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.stepperExit.settleMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1200"
                step="25"
                value={localConfig.stepperExit.settleMs}
                onInput={(e) => updateStepperExit({ settleMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateStepperExit({ settleMs: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Consente all&apos;utente di visualizzare il numero raggiunto (es. &quot;3/3&quot;).
              </p>
            </div>

            {/* Phase 3: Fade */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-neutral-800/40 border border-gray-200/60 dark:border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <span>3. Dissolvenza (Fade)</span>
                </span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                  {localConfig.stepperExit.fadeMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="25"
                value={localConfig.stepperExit.fadeMs}
                onInput={(e) => updateStepperExit({ fadeMs: Number((e.target as HTMLInputElement).value) })}
                onChange={(e) => updateStepperExit({ fadeMs: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-[11px] text-gray-500 leading-tight">
                Dissolvenza fluida prima del riordino automatico della lista.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DevStudioLayout>
  );
}
