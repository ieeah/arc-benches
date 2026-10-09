import { useCallback, useState } from 'react';
import { safeLS } from '@/lib/safeStorage';

const STORAGE_KEY = 'arc_benches_pass_view_prefs_v1';

export interface PassViewPrefs {
  /** Id delle tracce nascoste nella vista a griglia (valgono per tutti i pass che le dichiarano). */
  hiddenTracks: string[];
}

const DEFAULT_PREFS: PassViewPrefs = { hiddenTracks: [] };

export function readPassViewPrefs(): PassViewPrefs {
  return safeLS(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed: unknown = JSON.parse(raw);
    const hidden = (parsed as Partial<PassViewPrefs> | null)?.hiddenTracks;
    return { hiddenTracks: Array.isArray(hidden) ? hidden.filter((t): t is string => typeof t === 'string') : [] };
  }, DEFAULT_PREFS);
}

/** Preferenze di visualizzazione del pass, per dispositivo (non fanno parte del profilo). */
export function usePassViewPrefs() {
  const [prefs, setPrefs] = useState<PassViewPrefs>(readPassViewPrefs);

  const toggleTrack = useCallback((trackId: string) => {
    setPrefs((prev) => {
      const hiddenTracks = prev.hiddenTracks.includes(trackId)
        ? prev.hiddenTracks.filter((id) => id !== trackId)
        : [...prev.hiddenTracks, trackId];
      const next = { ...prev, hiddenTracks };
      safeLS(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(next)), undefined);
      return next;
    });
  }, []);

  return { prefs, toggleTrack, isTrackHidden: (trackId: string) => prefs.hiddenTracks.includes(trackId) };
}
