import { useState, useEffect } from 'react';
import { safeLS } from '@/lib/safeStorage';
import holdConfigSeed from '@/data/hold-config.json';

/**
 * Durate (ms) suddivise per fasi visive dell'animazione di completamento/uscita:
 * - feedbackMs: picco dell'effetto visivo (burst neon, ripple, audio/haptic cue)
 * - settleMs: tempo di sosta in stato completato (lettura della spunta verde prima della transizione)
 * - fadeMs: transizione CSS di uscita (fade-out / shrink) prima dell'unmount dal DOM
 */
export type VisualPhaseDurations = {
  /** Durata effetto visivo primario (bagliore/esplosione verde) in ms */
  feedbackMs: number;
  /** Tempo di lettura/sosta a completamento avvenuto con icona verde prima del fade in ms */
  settleMs: number;
  /** Durata della dissolvenza/uscita CSS finale in ms */
  fadeMs: number;
};

export type HoldConfig = {
  /** Millisecondi iniziali di "zona morta" per ignorare tocchi accidentali o scroll */
  deadzoneMs: number;
  /** Durata della pressione continua necessaria per completare l'oggetto (dopo la deadzone) */
  completeDurationMs: number;
  /** Durata della pressione continua necessaria per deselezionare l'oggetto (dopo la deadzone) */
  uncompleteDurationMs: number;
  /** Tolleranza movimento touch in pixel per non interrompere lo scroll della pagina */
  touchMoveThresholdPx: number;

  /** Fasi visive quando il completamento avviene via pressione prolungata (Hold-to-complete) */
  holdExit: VisualPhaseDurations;

  /** Fasi visive quando il completamento avviene via stepper numerico (+/input) */
  stepperExit: VisualPhaseDurations;

  // Alias retro-compatibili
  /** @deprecated Usa holdExit.feedbackMs */
  burstDurationMs: number;
};

export const DEFAULT_HOLD_CONFIG: HoldConfig = {
  deadzoneMs: holdConfigSeed.deadzoneMs,
  completeDurationMs: holdConfigSeed.completeDurationMs,
  uncompleteDurationMs: holdConfigSeed.uncompleteDurationMs,
  touchMoveThresholdPx: holdConfigSeed.touchMoveThresholdPx,
  holdExit: {
    feedbackMs: holdConfigSeed.holdExit.feedbackMs,
    settleMs: holdConfigSeed.holdExit.settleMs,
    fadeMs: holdConfigSeed.holdExit.fadeMs,
  },
  stepperExit: {
    feedbackMs: holdConfigSeed.stepperExit.feedbackMs,
    settleMs: holdConfigSeed.stepperExit.settleMs,
    fadeMs: holdConfigSeed.stepperExit.fadeMs,
  },
  get burstDurationMs() {
    return this.holdExit.feedbackMs;
  },
};

const STORAGE_KEY = 'arc_benches_hold_config_override_v1';
const EVENT_NAME = 'arc-benches:hold-config-changed';

/**
 * Restituisce se è presente un override salvato rispetto al seed su file.
 */
export function hasCustomHoldConfig(): boolean {
  return safeLS(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  }, false);
}

/**
 * Restituisce la configurazione attiva (eventualmente con override salvato in localStorage).
 */
export function getHoldConfig(): HoldConfig {
  return safeLS(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_HOLD_CONFIG;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HOLD_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      deadzoneMs: parsed.deadzoneMs ?? DEFAULT_HOLD_CONFIG.deadzoneMs,
      completeDurationMs: parsed.completeDurationMs ?? DEFAULT_HOLD_CONFIG.completeDurationMs,
      uncompleteDurationMs: parsed.uncompleteDurationMs ?? DEFAULT_HOLD_CONFIG.uncompleteDurationMs,
      touchMoveThresholdPx: parsed.touchMoveThresholdPx ?? DEFAULT_HOLD_CONFIG.touchMoveThresholdPx,
      holdExit: {
        feedbackMs: parsed.holdExit?.feedbackMs ?? DEFAULT_HOLD_CONFIG.holdExit.feedbackMs,
        settleMs: parsed.holdExit?.settleMs ?? DEFAULT_HOLD_CONFIG.holdExit.settleMs,
        fadeMs: parsed.holdExit?.fadeMs ?? DEFAULT_HOLD_CONFIG.holdExit.fadeMs,
      },
      stepperExit: {
        feedbackMs: parsed.stepperExit?.feedbackMs ?? DEFAULT_HOLD_CONFIG.stepperExit.feedbackMs,
        settleMs: parsed.stepperExit?.settleMs ?? DEFAULT_HOLD_CONFIG.stepperExit.settleMs,
        fadeMs: parsed.stepperExit?.fadeMs ?? DEFAULT_HOLD_CONFIG.stepperExit.fadeMs,
      },
      get burstDurationMs() {
        return this.holdExit.feedbackMs;
      },
    };
  }, DEFAULT_HOLD_CONFIG);
}

/**
 * Salva un override dei parametri in localStorage e notifica i componenti attivi.
 */
export function setHoldConfigOverride(override: Partial<HoldConfig>) {
  safeLS(() => {
    if (typeof localStorage === 'undefined') return;
    const current = getHoldConfig();
    const next: HoldConfig = {
      ...current,
      ...override,
      holdExit: {
        ...current.holdExit,
        ...(override.holdExit || {}),
      },
      stepperExit: {
        ...current.stepperExit,
        ...(override.stepperExit || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
    }
  }, undefined);
}

/**
 * Ripristina i parametri di default cancellando l'override da localStorage.
 */
export function resetHoldConfigOverride() {
  safeLS(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: DEFAULT_HOLD_CONFIG }));
    }
  }, undefined);
}

/**
 * Restituisce l'oggetto JSON serializzabile della configurazione corrente (senza getter).
 */
export function getHoldConfigSerializable(config: HoldConfig = getHoldConfig()) {
  return {
    deadzoneMs: config.deadzoneMs,
    completeDurationMs: config.completeDurationMs,
    uncompleteDurationMs: config.uncompleteDurationMs,
    touchMoveThresholdPx: config.touchMoveThresholdPx,
    holdExit: {
      feedbackMs: config.holdExit.feedbackMs,
      settleMs: config.holdExit.settleMs,
      fadeMs: config.holdExit.fadeMs,
    },
    stepperExit: {
      feedbackMs: config.stepperExit.feedbackMs,
      settleMs: config.stepperExit.settleMs,
      fadeMs: config.stepperExit.fadeMs,
    },
  };
}

/**
 * Hook reattivo per sincronizzare le viste e gli hook al variare dei parametri.
 */
export function useHoldConfig(): HoldConfig {
  const [config, setConfig] = useState<HoldConfig>(() => getHoldConfig());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (e: Event) => {
      const custom = e as CustomEvent<HoldConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
      } else {
        setConfig(getHoldConfig());
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return config;
}

/**
 * Costante statica retro-compatibile.
 */
export const HOLD_CONFIG = DEFAULT_HOLD_CONFIG;
