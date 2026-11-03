import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useHoldConfig, type HoldConfig } from '@/lib/holdConfig';

export type RetainedItemState = 'active' | 'grace' | 'exiting';

export type RetainedItemEntry = {
  id: string;
  isCompleted: boolean;
};

export type RetainedItemSource = 'hold' | 'stepper';

export type UseRetainedItemsOptions = {
  /** Override opzionale della durata (ms) di grazia */
  graceDurationMs?: number;
  /** Override opzionale della durata (ms) di uscita CSS */
  exitDurationMs?: number;
  /** Override o istanza personalizzata di HoldConfig */
  config?: Partial<HoldConfig>;
};

export function useRetainedItems(
  items: RetainedItemEntry[],
  options?: UseRetainedItemsOptions
) {
  const globalHoldConfig = useHoldConfig();
  const optionsConfig = options?.config;
  const holdConfig = useMemo(() => ({
    ...globalHoldConfig,
    ...optionsConfig,
    holdExit: {
      ...globalHoldConfig.holdExit,
      ...(optionsConfig?.holdExit || {}),
    },
    stepperExit: {
      ...globalHoldConfig.stepperExit,
      ...(optionsConfig?.stepperExit || {}),
    },
  }), [globalHoldConfig, optionsConfig]);

  const [retainedStates, setRetainedStates] = useState<Record<string, RetainedItemState>>({});

  const activeItemIdRef = useRef<string | null>(null);
  const timeoutsRef = useRef<Record<string, { graceTimer?: ReturnType<typeof setTimeout>; exitTimer?: ReturnType<typeof setTimeout> }>>({});
  const prevCompletedMapRef = useRef<Map<string, boolean> | null>(null);
  const itemsMapRef = useRef<Map<string, boolean>>(new Map());

  const clearItemTimers = useCallback((id: string) => {
    const existing = timeoutsRef.current[id];
    if (existing) {
      if (existing.graceTimer) clearTimeout(existing.graceTimer);
      if (existing.exitTimer) clearTimeout(existing.exitTimer);
      delete timeoutsRef.current[id];
    }
  }, []);

  const scheduleGraceExit = useCallback((id: string, source: RetainedItemSource = 'hold') => {
    clearItemTimers(id);

    const phaseConfig = source === 'hold' ? holdConfig.holdExit : holdConfig.stepperExit;
    const computedGraceMs = options?.graceDurationMs ?? (phaseConfig.feedbackMs + phaseConfig.settleMs);
    const computedExitMs = options?.exitDurationMs ?? phaseConfig.fadeMs;

    setRetainedStates(prev => ({ ...prev, [id]: 'grace' }));

    const graceTimer = setTimeout(() => {
      setRetainedStates(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: 'exiting' };
      });

      const exitTimer = setTimeout(() => {
        clearItemTimers(id);
        setRetainedStates(prev => {
          if (!prev[id]) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, computedExitMs);

      if (timeoutsRef.current[id]) {
        timeoutsRef.current[id].exitTimer = exitTimer;
      }
    }, computedGraceMs);

    timeoutsRef.current[id] = { graceTimer };
  }, [clearItemTimers, holdConfig, options?.graceDurationMs, options?.exitDurationMs]);

  // Gestione interazione: avvio pressione prolungata / touch
  const handleHoldStart = useCallback((id: string) => {
    activeItemIdRef.current = id;
    clearItemTimers(id);
  }, [clearItemTimers]);

  // Gestione interazione: rilascio pressione prolungata / touch
  const handleHoldEnd = useCallback((id: string) => {
    if (activeItemIdRef.current === id) {
      activeItemIdRef.current = null;
    }
    // Se l'elemento completato era trattenuto o è attualmente completato, avvia il grace period hold
    const isCompleted = itemsMapRef.current.get(id);
    if (isCompleted) {
      scheduleGraceExit(id, 'hold');
    } else {
      clearItemTimers(id);
      setRetainedStates(prev => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [clearItemTimers, scheduleGraceExit]);

  // Rileva transizioni di completamento tra i render
  useEffect(() => {
    const currentMap = new Map(items.map(i => [i.id, i.isCompleted]));

    // Al primo mount registriamo lo stato iniziale senza trattenere gli elementi già completati
    if (!prevCompletedMapRef.current) {
      prevCompletedMapRef.current = currentMap;
      return;
    }

    const prevMap = prevCompletedMapRef.current;

    for (const item of items) {
      const wasCompleted = prevMap.get(item.id) ?? false;
      const nowCompleted = item.isCompleted;

      // Transizione: da incompleto a completato
      if (!wasCompleted && nowCompleted) {
        if (activeItemIdRef.current === item.id) {
          // Il dito è ancora premuto sull'elemento: mantenerlo attivo senza timer
          clearItemTimers(item.id);
          setRetainedStates(prev => ({ ...prev, [item.id]: 'active' }));
        } else {
          // Completamento via stepper '+' o input manuale: avvia uscita graduale con tempi stepper
          scheduleGraceExit(item.id, 'stepper');
        }
      }
      // Transizione: da completato a incompleto (decremento / reset)
      else if (wasCompleted && !nowCompleted) {
        clearItemTimers(item.id);
        setRetainedStates(prev => {
          if (!prev[item.id]) return prev;
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    }

    prevCompletedMapRef.current = currentMap;
    itemsMapRef.current = currentMap;
  }, [items, clearItemTimers, scheduleGraceExit]);

  // Pulizia globale su unmount o reset esplicito
  const clearAll = useCallback(() => {
    Object.keys(timeoutsRef.current).forEach(id => clearItemTimers(id));
    activeItemIdRef.current = null;
    setRetainedStates({});
  }, [clearItemTimers]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      Object.keys(timeouts).forEach(id => {
        const t = timeouts[id];
        if (t?.graceTimer) clearTimeout(t.graceTimer);
        if (t?.exitTimer) clearTimeout(t.exitTimer);
      });
    };
  }, []);

  const isRetained = useCallback((id: string): boolean => {
    return activeItemIdRef.current === id || Boolean(retainedStates[id]);
  }, [retainedStates]);

  const isExiting = useCallback((id: string): boolean => {
    return retainedStates[id] === 'exiting';
  }, [retainedStates]);

  const markRetained = useCallback((id: string, source: RetainedItemSource = 'stepper') => {
    scheduleGraceExit(id, source);
  }, [scheduleGraceExit]);

  const cancelRetained = useCallback((id: string) => {
    clearItemTimers(id);
    setRetainedStates(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [clearItemTimers]);

  return {
    isRetained,
    isExiting,
    handleHoldStart,
    handleHoldEnd,
    markRetained,
    cancelRetained,
    clearAll,
  };
}
