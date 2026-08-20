import { useState } from 'react';
import {
  ArrowLeft, Check, Download, Hand, Moon, Plus,
  Sun, Trash2, Upload, Users, Info, Sparkles
} from 'lucide-react';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { useTheme } from '@/context/ThemeContext';
import { useAppStore } from '@/store';
import { downloadExport } from '@/lib/listIO';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { dark: isDark, toggle: toggleTheme } = useTheme();
  const store = useAppStore();

  const navSide = useAppStore(s => s.navSide);
  const setNavSide = useAppStore(s => s.setNavSide);
  const quickFavorites = useAppStore(s => s.quickFavorites) ?? ['stash', 'liste'];
  const setQuickFavorites = useAppStore(s => s.setQuickFavorites);

  const AVAILABLE_PAGES = [
    { id: 'stash', label: 'Stash' },
    { id: 'liste', label: 'Banchi & Liste' },
    { id: 'blueprints', label: 'Progetti Blueprints' },
    { id: 'items', label: 'Database Oggetti' },
    { id: 'settings', label: 'Impostazioni' },
  ];

  const handleFavoriteChange = (index: 0 | 1, value: string) => {
    const updated: [string, string] = [...quickFavorites] as [string, string];
    updated[index] = value;
    setQuickFavorites(updated);
    setFeedbackMsg(`Pagina Rapida ${index + 1} impostata su: ${AVAILABLE_PAGES.find(p => p.id === value)?.label}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };
  const mainProfileId = useAppStore(s => s.mainProfileId);
  const setMainProfileId = useAppStore(s => s.setMainProfileId);
  const startupProfileOption = useAppStore(s => s.startupProfileOption);
  const setStartupProfileOption = useAppStore(s => s.setStartupProfileOption);

  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleNavSideChange = (side: 'left' | 'right') => {
    setNavSide(side);
    setFeedbackMsg(`Posizione navigazione impostata a: ${side === 'right' ? 'Mano Destra' : 'Mano Sinistra'}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleMainProfileChange = (id: string) => {
    setMainProfileId(id);
    setFeedbackMsg('Profilo Principale aggiornato!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleStartupProfileChange = (option: string) => {
    setStartupProfileOption(option);
    setFeedbackMsg('Profilo all\'apertura aggiornato!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    store.createProfile(newProfileName.trim());
    setNewProfileName('');
    setShowNewProfileInput(false);
    setFeedbackMsg('Nuovo profilo creato con successo!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExport = () => {
    const { sharedLists, profiles: exported } = store.buildExportData(store.profiles.map(p => p.id));
    downloadExport({ version: 3, exportedAt: new Date().toISOString(), sharedLists, profiles: exported });
  };

  return (
    <div className="pb-36 p-4 max-w-xl mx-auto space-y-6">
      <SectionHeader
        title="Impostazioni"
        leading={
          <IconButton onClick={onBack} title="Indietro">
            <ArrowLeft size={18} />
          </IconButton>
        }
      />

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 font-semibold animate-in fade-in">
          {feedbackMsg}
        </div>
      )}

      {/* 1. ASPETTO & ERGONOMIA */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-blue-500" /> Aspetto & Ergonomia
        </h2>

        {/* Tema */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Tema Interfaccia</p>
            <p className="text-xs text-gray-500">Modalità chiara o scura ad alto contrasto</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
          >
            {isDark ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
            <span>{isDark ? 'Scuro' : 'Chiaro'}</span>
          </button>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Navigazione Rapida: Pagine Preferite per il Tap Singolo */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Pagine Preferite (Navigazione Rapida)</p>
            <p className="text-xs text-gray-500">
              Il <strong>tap singolo</strong> sul pulsante della pill alterna tra queste due pagine. La <strong>pressione prolungata</strong> apre il menù completo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pagina 1</label>
              <select
                value={quickFavorites[0]}
                onChange={(e) => handleFavoriteChange(0, e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABLE_PAGES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pagina 2</label>
              <select
                value={quickFavorites[1]}
                onChange={(e) => handleFavoriteChange(1, e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABLE_PAGES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        {/* Lato Navigazione */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Posizione Barra Flottante</p>
              <p className="text-xs text-gray-500">Ottimizzato per uso con pollice destro o sinistro</p>
            </div>
            <Hand size={18} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleNavSideChange('left')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                navSide === 'left'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              Mano Sinistra {navSide === 'left' && <Check size={14} />}
            </button>
            <button
              onClick={() => handleNavSideChange('right')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                navSide === 'right'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              Mano Destra {navSide === 'right' && <Check size={14} />}
            </button>
          </div>
        </div>
      </section>

      {/* 2. GESTIONE PROFILI & PREFERENZE DI AVVIO */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Users size={14} className="text-purple-500" /> Gestione Profili ({store.profiles.length})
          </h2>
          {!showNewProfileInput && (
            <button
              onClick={() => setShowNewProfileInput(true)}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Nuovo
            </button>
          )}
        </div>

        {/* Profilo Principale vs Profilo all'Apertura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
          <div>
            <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1">
              ⭐ Profilo Principale:
            </label>
            <select
              value={mainProfileId}
              onChange={e => handleMainProfileChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200"
            >
              {store.profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.id === store.activeProfileId ? '(In uso)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1">
              🚀 Profilo all'Apertura:
            </label>
            <select
              value={startupProfileOption}
              onChange={e => handleStartupProfileChange(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 dark:text-gray-200"
            >
              <option value="last-used">Ultimo profilo utilizzato</option>
              <option value="main">Sempre il Profilo Principale</option>
              {store.profiles.map(p => (
                <option key={p.id} value={p.id}>
                  Fisso: {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showNewProfileInput && (
          <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in">
            <input
              type="text"
              placeholder="Nome profilo (es. Personaggio 2)"
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-xl text-xs text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleCreateProfile}
              className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
            >
              Crea
            </button>
            <button
              onClick={() => setShowNewProfileInput(false)}
              className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all"
            >
              Annulla
            </button>
          </div>
        )}

        <div className="space-y-2">
          {store.profiles.map(p => {
            const isActive = p.id === store.activeProfileId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/80 shadow-sm'
                    : 'bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{p.name}</span>
                    {isActive && (
                      <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.2 rounded-full">
                        Attivo
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">ID: {p.id}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isActive && (
                    <>
                      <button
                        onClick={() => store.switchProfile(p.id)}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 shadow-sm hover:bg-purple-50"
                      >
                        Attiva
                      </button>
                      {store.profiles.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare il profilo "${p.name}"? Tutti i dati associati andranno persi.`)) {
                              store.deleteProfile(p.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-500"
                          title="Elimina profilo"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. BACKUP & DATI */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Download size={14} className="text-emerald-500" /> Backup & Portabilità
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex flex-col items-center gap-1.5 transition-colors"
          >
            <Upload size={18} className="text-blue-500" />
            <span>Esporta Backup JSON</span>
          </button>
          <button
            onClick={() => alert('Usa la voce Importa dal menu rapido o trascina il file JSON')}
            className="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex flex-col items-center gap-1.5 transition-colors"
          >
            <Download size={18} className="text-emerald-500" />
            <span>Importa Backup JSON</span>
          </button>
        </div>
      </section>

      {/* 4. INFORMAZIONI APP */}
      <section className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-[24px] text-center space-y-1">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5">
          <Info size={14} className="text-blue-500" /> ARC Benches Tracker
        </p>
        <p className="text-[11px] text-gray-500">
          Versione <span className="font-mono font-bold text-gray-700 dark:text-gray-300">0.2.0</span> • Dati catalogo MetaForge
        </p>
      </section>
    </div>
  );
};