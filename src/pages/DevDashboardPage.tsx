import { useMemo, useState } from 'react';
import {
  ArrowLeft, Archive, Code2, Download, FileJson, FlaskConical, Flag, Languages, PackagePlus, Layers, RotateCcw, Route,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AppRoute } from '@/router';
import { SectionHeader } from '@/components/SectionHeader';
import { IconButton } from '@/components/IconButton';
import { StickyHeader } from '@/components/StickyHeader';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';
import { createZip } from '@/lib/zip';
import { getDevArtifacts, type DevArtifact } from '@/lib/devArtifacts';
import { downloadTextFile } from '@/lib/devI18n';
import { cn } from '@/lib/cn';

interface DevDashboardPageProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface DevTool {
  route: AppRoute;
  title: string;
  description: string;
  icon: ReactNode;
}

const DEV_TOOLS: DevTool[] = [
  { route: 'dev-lists', title: 'Gestione Liste', description: 'Editor di banchi, spedizioni, progetti e quest', icon: <Layers size={20} className="text-emerald-500" /> },
  { route: 'dev-overrides', title: 'Override Oggetti', description: 'Correzioni ai dati MetaForge, traduzioni e visibilità', icon: <FileJson size={20} className="text-purple-500" /> },
  { route: 'dev-custom-items', title: 'Oggetti Custom', description: 'Oggetti di gioco assenti da MetaForge, con icone e traduzioni', icon: <PackagePlus size={20} className="text-rose-500" /> },
  { route: 'dev-translations', title: 'Traduzioni UI', description: 'Stringhe dell\'interfaccia in italiano e inglese', icon: <Languages size={20} className="text-blue-500" /> },
  { route: 'dev-nav', title: 'Menu di Navigazione', description: 'Editor drag & drop del menu', icon: <Route size={20} className="text-gray-500" /> },
  { route: 'dev-flags', title: 'Feature Flags', description: 'Moduli, rotte e sottomenu attivi', icon: <Flag size={20} className="text-purple-500" /> },
  { route: 'dev-lab', title: 'Catalog Lab', description: 'Laboratorio del catalogo (sola consultazione)', icon: <FlaskConical size={20} className="text-amber-500" /> },
];

function downloadBlob(filename: string, bytes: Uint8Array) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type Confirm = { title: string; message: string; description: string; confirmText: string; onConfirm: () => void } | null;

export function DevDashboardPage({ onBack, onNavigate }: DevDashboardPageProps) {
  // Lo stato delle bozze vive in localStorage: si rilegge alla prima visualizzazione.
  const artifacts = useMemo(
    () => getDevArtifacts().map((artifact) => ({ artifact, modified: artifact.isModified() })),
    [],
  );
  const modified = artifacts.filter((a) => a.modified);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const modifiedByRoute = (route: AppRoute) => modified.filter((a) => a.artifact.route === route).length;

  const downloadZip = () => {
    const zip = createZip(modified.map(({ artifact }) => ({ path: artifact.file, content: artifact.build() })));
    downloadBlob(`arc-benches-dev-${new Date().toISOString().slice(0, 10)}.zip`, zip);
  };

  const downloadOne = (artifact: DevArtifact) => {
    const name = artifact.file.split('/').pop() ?? artifact.file;
    downloadTextFile(name, artifact.build(), artifact.file.endsWith('.json') ? 'application/json' : 'text/typescript');
  };

  // Le bozze alimentano i dati caricati all'avvio: dopo lo scarto si ricarica la pagina.
  const resetAndReload = (targets: DevArtifact[]) => {
    targets.forEach((a) => a.reset());
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <StickyHeader>
        <SectionHeader
          title="Dev Studio"
          leading={
            <IconButton onClick={onBack} title="Indietro">
              <ArrowLeft size={16} />
            </IconButton>
          }
          actions={
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Code2 size={11} /> Dev only
            </span>
          }
        />
      </StickyHeader>

      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strumenti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEV_TOOLS.map((tool) => {
              const count = modifiedByRoute(tool.route);
              return (
                <button
                  key={tool.route}
                  type="button"
                  onClick={() => onNavigate(tool.route)}
                  className="p-3.5 flex items-center gap-3 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-[24px] transition-colors cursor-pointer"
                >
                  <span className="shrink-0">{tool.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate">{tool.title}</span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{tool.description}</span>
                  </span>
                  {count > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {count} {count === 1 ? 'file' : 'file'} da salvare
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              File aggiornati ({modified.length} su {artifacts.length} modificati)
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <ApplyToProjectButton
                artifactIds={artifacts.map((a) => a.artifact.id)}
                label={`Applica al progetto (${modified.length})`}
                disabled={modified.length === 0}
              />
              <button
                type="button"
                disabled={modified.length === 0}
                onClick={downloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Un unico ZIP con i file modificati, ciascuno nel suo percorso del repository"
              >
                <Archive size={13} /> Scarica ZIP ({modified.length})
              </button>
              <button
                type="button"
                disabled={modified.length === 0}
                onClick={() =>
                  setConfirm({
                    title: 'Scarta tutte le bozze',
                    message: `Scartare le bozze di ${modified.length} file?`,
                    description: 'Gli strumenti Dev tornano ai file inclusi nell\'app. Le modifiche non scaricate andranno perse e la pagina verrà ricaricata.',
                    confirmText: 'Scarta tutto',
                    onConfirm: () => resetAndReload(modified.map((m) => m.artifact)),
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw size={13} /> Scarta bozze
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            «Applica al progetto» scrive i file direttamente nel repository (serve il dev server in locale) e ricarica la pagina.
            In alternativa scarica lo ZIP ed estrailo nella radice del repository: i file sovrascrivono quelli in <code className="font-mono">src/</code>.
            Poi rigenera i dati con gli script, se serve, e committa.
          </p>

          <ul className="space-y-1.5">
            {artifacts.map(({ artifact, modified: isModified }) => (
              <li
                key={artifact.id}
                className="p-3 flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl"
              >
                <span
                  className={cn('w-2 h-2 rounded-full shrink-0', isModified ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700')}
                  title={isModified ? 'Modificato' : 'Invariato'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{artifact.label}</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate">{artifact.file}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(artifact.route)}
                  className="px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                >
                  Apri
                </button>
                <button
                  type="button"
                  onClick={() => downloadOne(artifact)}
                  className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                  title="Scarica questo file"
                  aria-label={`Scarica ${artifact.file}`}
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  disabled={!isModified}
                  onClick={() =>
                    setConfirm({
                      title: 'Scarta bozza',
                      message: `Scartare la bozza di ${artifact.label}?`,
                      description: 'Torna al file incluso nell\'app; la pagina verrà ricaricata.',
                      confirmText: 'Scarta',
                      onConfirm: () => resetAndReload([artifact]),
                    })
                  }
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Scarta la bozza di questo file"
                  aria-label={`Scarta la bozza di ${artifact.label}`}
                >
                  <RotateCcw size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {confirm && (
        <ConfirmActionModal
          title={confirm.title}
          message={confirm.message}
          description={confirm.description}
          confirmText={confirm.confirmText}
          variant="warning"
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
