import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Globe, Search, Download, Copy, Check, RotateCcw,
  Languages, FileCode, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { it as defaultIt } from '@/i18n/locales/it';
import { en as defaultEn } from '@/i18n/locales/en';
import { useTranslation, SUPPORTED_LANGUAGES } from '@/i18n';

// Flatten nested object into dot-notation paths
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullPath));
    } else if (typeof value === 'string') {
      result[fullPath] = value;
    }
  }
  return result;
}

// Unflatten dot-notation paths back into structured object
function unflattenObject(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

interface DevTranslationsPageProps {
  onBack: () => void;
}

type PreviewTab = 'it' | 'en' | 'json';

export function DevTranslationsPage({ onBack }: DevTranslationsPageProps) {
  const { t, language } = useTranslation();
  // Flat dictionaries
  const defaultFlatIt = useMemo(() => flattenObject(defaultIt), []);
  const defaultFlatEn = useMemo(() => flattenObject(defaultEn), []);

  const [itTranslations, setItTranslations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('dev_i18n_it_draft');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return defaultFlatIt;
  });

  const [enTranslations, setEnTranslations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('dev_i18n_en_draft');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return defaultFlatEn;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [selectedKey, setSelectedKey] = useState<string>('nav.benches');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('it');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // All unique keys
  const allKeys = useMemo(() => {
    const keys = Array.from(new Set([...Object.keys(defaultFlatIt), ...Object.keys(itTranslations)]));
    return keys.sort();
  }, [defaultFlatIt, itTranslations]);

  // Namespaces (first part of dot notation)
  const namespaces = useMemo(() => {
    const set = new Set<string>();
    for (const key of allKeys) {
      const ns = key.split('.')[0];
      if (ns) set.add(ns);
    }
    return Array.from(set).sort();
  }, [allKeys]);

  // Save drafts to localStorage debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('dev_i18n_it_draft', JSON.stringify(itTranslations));
        localStorage.setItem('dev_i18n_en_draft', JSON.stringify(enTranslations));
      } catch (err) {
        console.warn('Errore salvataggio bozza i18n:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [itTranslations, enTranslations]);

  // Filtered keys for sidebar
  const filteredKeys = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allKeys.filter(k => {
      if (selectedNamespace !== 'all' && !k.startsWith(`${selectedNamespace}.`)) {
        return false;
      }
      if (!q) return true;
      const itVal = (itTranslations[k] || '').toLowerCase();
      const enVal = (enTranslations[k] || '').toLowerCase();
      return k.toLowerCase().includes(q) || itVal.includes(q) || enVal.includes(q);
    });
  }, [allKeys, selectedNamespace, searchQuery, itTranslations, enTranslations]);

  const handleKeySelect = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const handleItChange = (val: string) => {
    setItTranslations(prev => ({ ...prev, [selectedKey]: val }));
  };

  const handleEnChange = (val: string) => {
    setEnTranslations(prev => ({ ...prev, [selectedKey]: val }));
  };

  const handleResetCurrentKey = () => {
    if (!selectedKey) return;
    setItTranslations(prev => {
      const updated = { ...prev };
      if (defaultFlatIt[selectedKey]) updated[selectedKey] = defaultFlatIt[selectedKey];
      return updated;
    });
    setEnTranslations(prev => {
      const updated = { ...prev };
      if (defaultFlatEn[selectedKey]) updated[selectedKey] = defaultFlatEn[selectedKey];
      return updated;
    });
  };

  const handleResetAll = () => {
    if (confirm(language === 'en' ? 'Are you sure you want to reset all translations to their default values? Unexported changes will be lost.' : 'Sei sicuro di voler ripristinare tutte le traduzioni ai valori predefiniti? Le modifiche non esportate andranno perse.')) {
      setItTranslations(defaultFlatIt);
      setEnTranslations(defaultFlatEn);
      localStorage.removeItem('dev_i18n_it_draft');
      localStorage.removeItem('dev_i18n_en_draft');
    }
  };

  // Extract variables like {count}, {name} from current translation string
  const currentParams = useMemo(() => {
    const text = (itTranslations[selectedKey] || defaultFlatIt[selectedKey] || '') + ' ' + (enTranslations[selectedKey] || defaultFlatEn[selectedKey] || '');
    const matches = text.match(/\{(\w+)\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.slice(1, -1))));
  }, [selectedKey, itTranslations, enTranslations, defaultFlatIt, defaultFlatEn]);

  // Statistics
  const modifiedKeysCount = useMemo(() => {
    let count = 0;
    for (const key of allKeys) {
      if (itTranslations[key] !== defaultFlatIt[key] || enTranslations[key] !== defaultFlatEn[key]) {
        count++;
      }
    }
    return count;
  }, [allKeys, itTranslations, enTranslations, defaultFlatIt, defaultFlatEn]);

  // Generate output code for Preview tab
  const previewCode = useMemo(() => {
    if (previewTab === 'it') {
      const structured = unflattenObject(itTranslations);
      return `export const it = ${JSON.stringify(structured, null, 2)};\n\nexport type LocaleSchema = typeof it;\n`;
    }
    if (previewTab === 'en') {
      const structured = unflattenObject(enTranslations);
      return `import type { LocaleSchema } from './it';\n\nexport const en: LocaleSchema = ${JSON.stringify(structured, null, 2)};\n`;
    }
    if (previewTab === 'json') {
      const combined = {
        it: unflattenObject(itTranslations),
        en: unflattenObject(enTranslations),
      };
      return JSON.stringify(combined, null, 2);
    }
    return '';
  }, [previewTab, itTranslations, enTranslations]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      alert(language === 'en' ? 'Unable to copy to clipboard' : 'Impossibile copiare negli appunti');
    }
  };

  const handleDownload = () => {
    let filename = `locales-${previewTab}.ts`;
    let mime = 'text/typescript';
    if (previewTab === 'json') {
      filename = 'locales.json';
      mime = 'application/json';
    } else {
      filename = `${previewTab}.ts`;
    }

    const blob = new Blob([previewCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DevStudioLayout
      title="i18n UI Translations Studio"
      subtitle={language === 'en' ? "View, edit and export UI multi-language dictionaries (src/i18n/locales/)" : "Visualizza, modifica ed esporta i dizionari multilingua dell'interfaccia utente (src/i18n/locales/)"}
      icon={<Globe size={18} className="text-blue-500" />}
      onBack={onBack}
      headerActions={
        <>
          <div className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
            <Languages size={13} />
            <span>{allKeys.length} {language === 'en' ? 'Keys' : 'Stringhe'}</span>
          </div>

          {modifiedKeysCount > 0 && (
            <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>{modifiedKeysCount} {language === 'en' ? 'Modified' : 'Modificate'}</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copyFeedback ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copyFeedback ? (language === 'en' ? 'Copied!' : 'Copiato!') : `${language === 'en' ? 'Copy' : 'Copia'} ${previewTab.toUpperCase()}`}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>{language === 'en' ? 'Download' : 'Scarica'} {previewTab.toUpperCase()}</span>
          </button>

          <button
            onClick={handleResetAll}
            className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
            title={language === 'en' ? 'Reset default translations' : 'Ripristina traduzioni predefinite'}
          >
            <RotateCcw size={15} />
          </button>
        </>
      }
      sidebar={
        <>
          {/* Ricerca e Filtri */}
          <div className="shrink-0 p-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search key or text…' : 'Cerca per chiave o testo…'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedNamespace('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedNamespace === 'all'
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('common.all')}
              </button>
              {namespaces.map(ns => (
                <button
                  key={ns}
                  onClick={() => setSelectedNamespace(ns)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono shrink-0 transition-all cursor-pointer ${
                    selectedNamespace === ns
                      ? 'bg-blue-500 text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {ns}
                </button>
              ))}
            </div>
          </div>

          {/* Elenco Chiavi */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredKeys.map(k => {
              const isSelected = selectedKey === k;
              const isModified = itTranslations[k] !== defaultFlatIt[k] || enTranslations[k] !== defaultFlatEn[k];
              const isMissingEn = !enTranslations[k];

              return (
                <button
                  key={k}
                  onClick={() => handleKeySelect(k)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-xs'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isMissingEn ? (
                      <AlertCircle size={13} className="text-amber-500" />
                    ) : (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 truncate">
                        {k}
                      </p>
                      {isModified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      🇮🇹 {itTranslations[k]}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                      🇬🇧 {enTranslations[k] || <span className="italic text-amber-500">Mancante</span>}
                    </p>
                  </div>
                </button>
              );
            })}
            {filteredKeys.length === 0 && (
              <div className="p-8 text-center text-xs text-gray-400">
                Nessuna chiave di traduzione trovata
              </div>
            )}
          </div>
        </>
      }
      previewTitle={previewTab === 'json' ? 'locales.json' : `locales/${previewTab}.ts`}
      previewIcon={<FileCode size={14} className="text-blue-400" />}
      previewBadge={
        <div className="flex items-center gap-1">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => setPreviewTab(lang.code as PreviewTab)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                previewTab === lang.code ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {lang.code.toUpperCase()}.TS
            </button>
          ))}
          <button
            onClick={() => setPreviewTab('json')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              previewTab === 'json' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            JSON
          </button>
        </div>
      }
      previewContent={<pre>{previewCode}</pre>}
    >
      {/* ── AREA DI EDITING CENTRALE ── */}
      {selectedKey ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header Chiave Selezionata */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md font-mono">
                  {selectedKey.split('.')[0]}
                </span>
                <h2 className="text-base font-black font-mono text-gray-900 dark:text-gray-100">
                  {selectedKey}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Percorso di traduzione: <code className="font-mono text-blue-500">t('{selectedKey}')</code>
              </p>
            </div>

            <button
              onClick={handleResetCurrentKey}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer transition-all"
              title={language === 'en' ? 'Reset default values for this key' : 'Ripristina valori originali per questa chiave'}
            >
              <RotateCcw size={13} />
              <span>{language === 'en' ? 'Reset Default' : 'Ripristina Default'}</span>
            </button>
          </div>

          {/* Parametri Rilevati */}
          {currentParams.length > 0 && (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} /> {language === 'en' ? 'Dynamic Parameters Detected:' : 'Parametri Dinamici Rilevati:'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {currentParams.map(param => (
                  <span
                    key={param}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-xs font-bold"
                  >
                    {`{${param}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editor Italiano */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>🇮🇹</span>
                <span>{language === 'en' ? 'Italian Text (IT)' : 'Testo in Italiano (IT)'}</span>
              </label>
              {defaultFlatIt[selectedKey] && (
                <span className="text-[10px] text-gray-400 font-mono">
                  Default: {defaultFlatIt[selectedKey]}
                </span>
              )}
            </div>

            {(itTranslations[selectedKey] || '').length > 45 ? (
              <textarea
                rows={3}
                value={itTranslations[selectedKey] || ''}
                onChange={e => handleItChange(e.target.value)}
                placeholder={language === 'en' ? 'Insert Italian translation…' : 'Inserisci traduzione in italiano…'}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
              />
            ) : (
              <input
                type="text"
                value={itTranslations[selectedKey] || ''}
                onChange={e => handleItChange(e.target.value)}
                placeholder={language === 'en' ? 'Insert Italian translation…' : 'Inserisci traduzione in italiano…'}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            )}
          </div>

          {/* Editor Inglese */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>🇬🇧</span>
                <span>{language === 'en' ? 'English Text (EN)' : 'Testo in Inglese (EN)'}</span>
              </label>
              {defaultFlatEn[selectedKey] && (
                <span className="text-[10px] text-gray-400 font-mono">
                  Default: {defaultFlatEn[selectedKey]}
                </span>
              )}
            </div>

            {(enTranslations[selectedKey] || '').length > 45 ? (
              <textarea
                rows={3}
                value={enTranslations[selectedKey] || ''}
                onChange={e => handleEnChange(e.target.value)}
                placeholder="Insert English translation…"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
              />
            ) : (
              <input
                type="text"
                value={enTranslations[selectedKey] || ''}
                onChange={e => handleEnChange(e.target.value)}
                placeholder="Insert English translation…"
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-gray-400">
          {language === 'en' ? 'Select a translation key from the left column' : 'Seleziona una chiave di traduzione dalla colonna di sinistra'}
        </div>
      )}
    </DevStudioLayout>
  );
}
