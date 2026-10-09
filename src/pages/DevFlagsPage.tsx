import { useState, useMemo } from 'react';
import {
  Flag, RotateCcw, Download, Copy, Check, Sparkles,
  CheckCircle2, XCircle, Search, Compass, ShieldAlert,
  Dice5, Map as MapIcon, ScrollText, AlertTriangle, ShieldCheck, Filter,
} from 'lucide-react';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import {
  FEATURE_FLAGS_DEFINITIONS,
  useFeatureFlags,
  type FeatureFlagId,
  type FeatureFlagsState,
} from '@/lib/featureFlags';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';

interface DevFlagsPageProps {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<'all' | 'core' | 'tools', string> = {
  all: 'Tutti i Flag',
  core: 'Funzionalità Core',
  tools: 'Strumenti & Utility',
};

function getFlagIcon(id: FeatureFlagId) {
  switch (id) {
    case 'expeditions':
      return <Compass size={22} className="text-amber-500" />;
    case 'vault':
      return <ShieldAlert size={22} className="text-rose-500" />;
    case 'role-maker':
      return <Dice5 size={22} className="text-purple-500" />;
    case 'maps':
      return <MapIcon size={22} className="text-emerald-500" />;
    case 'blueprints':
      return <ScrollText size={22} className="text-blue-500" />;
    default:
      return <Flag size={22} className="text-gray-400" />;
  }
}

function downloadFlagsJson(flags: FeatureFlagsState) {
  const blob = new Blob([JSON.stringify(flags, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'feature-flags.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function DevFlagsPage({ onBack }: DevFlagsPageProps) {
  const { flags, isEnabled, setFlag, setAll, reset, isDirty } = useFeatureFlags();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'tools'>('all');
  const [copied, setCopied] = useState(false);

  const activeCount = useMemo(() => {
    return Object.values(flags).filter(Boolean).length;
  }, [flags]);

  const disabledCount = useMemo(() => {
    return FEATURE_FLAGS_DEFINITIONS.length - activeCount;
  }, [activeCount]);

  const filteredDefinitions = useMemo(() => {
    return FEATURE_FLAGS_DEFINITIONS.filter(def => {
      if (selectedCategory !== 'all' && def.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = def.name.toLowerCase().includes(q);
        const matchesDesc = def.description.toLowerCase().includes(q);
        const matchesId = def.id.toLowerCase().includes(q);
        const matchesRoutes = def.routes.some(r => r.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesId || matchesRoutes;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(flags, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <DevStudioLayout
      title="Feature Flags Studio"
      subtitle="Attiva o disattiva moduli, rotte e sottomenu in tempo reale. I cambiamenti si riflettono istantaneamente su menu, router e stash."
      icon={<Flag size={20} className="text-purple-500" />}
      onBack={onBack}
      headerActions={
        <>
          <button
            type="button"
            onClick={reset}
            disabled={!isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            title="Ripristina tutte le impostazioni ai valori di fabbrica (tutti attivi)"
          >
            <RotateCcw size={14} /> Ripristina Default
          </button>

          <button
            type="button"
            onClick={() => setAll(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors cursor-pointer"
            title="Attiva tutti i flag contemporaneamente"
          >
            <CheckCircle2 size={14} /> Attiva Tutti
          </button>

          <button
            type="button"
            onClick={() => setAll(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors cursor-pointer"
            title="Disattiva tutti i flag per test di isolamento"
          >
            <XCircle size={14} /> Disattiva Tutti
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            title="Copia configurazione JSON negli appunti"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copiato!' : 'Copia'}
          </button>

          <button
            type="button"
            onClick={() => downloadFlagsJson(flags)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors cursor-pointer shadow-sm"
            title="Scarica feature-flags.json"
          >
            <Download size={14} /> feature-flags.json
          </button>

          <ApplyToProjectButton artifactIds={['feature-flags']} label="Applica al file" />
        </>
      }
      sidebar={
        <div className="p-4 space-y-5 text-xs text-gray-600 dark:text-gray-400">
          {/* Statistiche Riassuntive */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
              <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Flag Attivi</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-center">
              <span className="block text-xl font-black text-rose-600 dark:text-rose-400">{disabledCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Disattivati</span>
            </div>
          </div>

          {/* Ricerca */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Search size={11} /> Cerca Flag
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filtra per nome, id, rotta…"
                className="w-full bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Categorie */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Filter size={11} /> Categorie
            </label>
            <div className="flex flex-col gap-1">
              {(['all', 'core', 'tools'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-left font-bold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  {selectedCategory === cat && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>

          {/* Guida Funzionamento */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 space-y-2 text-[11px] leading-relaxed">
            <p className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Sparkles size={13} className="text-purple-500" /> Effetti Live
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
              <li><strong>Navigazione</strong>: Rimuove istantaneamente le voci dal floating nav e dai preferiti.</li>
              <li><strong>Router</strong>: Le rotte disabilitate reindirizzano subito su <code>#/stash</code>.</li>
              <li><strong>Stash</strong>: I requisiti di materiali e le azioni legate alle feature spente vengono esclusi dai conteggi.</li>
              <li><strong>Modali</strong>: Impedisce l'apertura delle modali disattivate (es. Role Maker).</li>
            </ul>
          </div>
        </div>
      }
      previewTitle="feature-flags.json"
      previewBadge={isDirty ? 'Modificato' : 'Default'}
      previewContent={<pre className="whitespace-pre-wrap">{JSON.stringify(flags, null, 2)}</pre>}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredDefinitions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] space-y-2">
            <AlertTriangle size={32} className="mx-auto text-amber-500" />
            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">Nessuna feature flag corrisponde ai criteri</p>
            <p className="text-xs text-gray-400">Modifica i termini di ricerca o seleziona un'altra categoria.</p>
          </div>
        ) : (
          filteredDefinitions.map(def => {
            const enabled = isEnabled(def.id);

            return (
              <div
                key={def.id}
                className={`p-6 bg-white dark:bg-gray-900 border transition-all rounded-[28px] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  enabled
                    ? 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-800/80'
                    : 'border-rose-200 dark:border-rose-950/60 bg-rose-50/10 dark:bg-rose-950/5'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    enabled
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}>
                    {getFlagIcon(def.id)}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-gray-900 dark:text-white">
                        {def.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        #{def.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        def.category === 'core'
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}>
                        {def.category}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {def.description}
                    </p>

                    {/* Badge Rotte & Navigazione collegate */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rotte:</span>
                      {def.routes.map(r => (
                        <code
                          key={r}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-gray-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40"
                        >
                          #/{r}
                        </code>
                      ))}
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nav ID:</span>
                      {def.navIds.map(nid => (
                        <code
                          key={nid}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-gray-50 dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
                        >
                          {nid}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controllo Switch Toggle */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {enabled ? 'Attivo' : 'Disattivato'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => setFlag(def.id, !enabled)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          enabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium">
                    {enabled ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck size={11} /> Visibile & Calcolato
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-500">
                        <XCircle size={11} /> Nascosto & Escluso
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DevStudioLayout>
  );
}
