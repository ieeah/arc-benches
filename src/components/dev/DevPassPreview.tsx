import { useState } from 'react';
import { Lock, Minus, Plus } from 'lucide-react';
import type { PassList } from '@/types';
import { useTranslation } from '@/i18n';
import { PassCard } from '@/components/pass/PassCard';
import { PassDetailSummary } from '@/components/pass/PassDetailSummary';
import { PassLevelsGrid } from '@/components/pass/PassLevelsGrid';
import { getTrackName } from '@/lib/rewardPass';
import { cn } from '@/lib/cn';

type View = 'card' | 'detail' | 'levels';

const VIEWS: { id: View; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'detail', label: 'Dettaglio' },
  { id: 'levels', label: 'Livelli e tracce' },
];

/**
 * Anteprima, con i dati della bozza, delle tre schermate che l'utente vede per un pass: la card
 * dell'elenco, la pagina di dettaglio e la vista a livelli con le tracce. Il tier raggiunto si simula
 * qui, senza toccare il profilo, per vedere livelli disabilitati e scorrimento.
 */
export const DevPassPreview = ({ pass }: { pass: PassList }) => {
  const { language } = useTranslation();
  const [view, setView] = useState<View>('levels');
  const [reached, setReached] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const maxReached = Math.min(reached, pass.maxLevel);

  const toggleTrack = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="font-sans text-gray-900 dark:text-gray-100 space-y-3 select-text">
      <div className="flex gap-1" role="tablist" aria-label="Schermata del pass">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={cn(
              'flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors',
              view === v.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-gray-50 dark:bg-black p-3 space-y-3">
        {view === 'card' && <PassCard pass={pass} onOpen={() => setView('detail')} />}

        {view === 'detail' && <PassDetailSummary pass={pass} />}

        {view === 'levels' && (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-500">Tier raggiunto (simulato)</span>
                <button
                  type="button"
                  onClick={() => setReached(Math.max(0, maxReached - 1))}
                  disabled={maxReached <= 0}
                  aria-label="Diminuisci il tier"
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Minus size={12} />
                </button>
                <span className="font-mono font-black w-12 text-center">{maxReached}/{pass.maxLevel}</span>
                <button
                  type="button"
                  onClick={() => setReached(Math.min(pass.maxLevel, maxReached + 1))}
                  disabled={maxReached >= pass.maxLevel}
                  aria-label="Aumenta il tier"
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {pass.tracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    role="switch"
                    aria-checked={!hidden.has(track.id)}
                    onClick={() => toggleTrack(track.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full font-bold border cursor-pointer flex items-center gap-1',
                      hidden.has(track.id)
                        ? 'border-gray-300 dark:border-gray-700 text-gray-400 line-through'
                        : 'border-purple-400 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40',
                    )}
                    title="Mostra o nascondi la traccia (come nelle opzioni di visualizzazione dell'app)"
                  >
                    {track.locked && <Lock size={9} />}
                    {getTrackName(track, language)}
                  </button>
                ))}
              </div>
            </div>
            <PassLevelsGrid pass={pass} reached={maxReached} hiddenTracks={hidden} onSetTier={setReached} />
          </>
        )}
      </div>
    </div>
  );
};
