import { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  type DragStartEvent, type DragOverEvent, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Route, GripVertical, RotateCcw, Download, Eye, EyeOff, FolderOpen, ChevronRight,
  Languages, RefreshCw, FileCode,
} from 'lucide-react';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { useDevNavDraft } from '@/hooks/dev/useDevNavDraft';
import { NAV_ICON_NAMES, navIcon } from '@/lib/navIcons';
import type { NavConfig, NavConfigItem } from '@/lib/navTree';
import {
  ROOT_CONTAINER, containersOf, locate, moveItem, patchItem,
} from '@/lib/navConfigEdit';
import {
  getTranslationValue, getDefaultTranslationValue, hasTranslationOverride, setTranslationValue,
  countModifiedKeys, downloadLocaleFile,
} from '@/lib/devI18n';

const I18N_LANGS = ['it', 'en'] as const;

interface DevNavPageProps {
  onBack: () => void;
}

function download(config: NavConfig) {
  const blob = new Blob([JSON.stringify(config, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nav.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Inline IT/EN editor for a labelKey's translation strings (writes the dev i18n draft). */
function TranslationEditor({ labelKey, onEdited }: { labelKey: string; onEdited: () => void }) {
  const [, forceRerender] = useState(0);
  return (
    <div className="ml-8 mt-1.5 flex flex-col gap-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        <Languages size={11} /> Traduzioni di <code className="font-mono normal-case">{labelKey}</code>
        <span className="font-normal lowercase text-gray-400">— effettive al reload</span>
      </p>
      {I18N_LANGS.map(lang => {
        const value = getTranslationValue(lang, labelKey);
        const def = getDefaultTranslationValue(lang, labelKey);
        const overridden = hasTranslationOverride(lang, labelKey);
        return (
          <div key={lang} className="flex items-center gap-2">
            <span className="shrink-0 w-6 font-mono text-[10px] font-bold uppercase text-gray-500">{lang}</span>
            <input
              defaultValue={value}
              onBlur={e => {
                if (e.target.value !== value) {
                  setTranslationValue(lang, labelKey, e.target.value);
                  onEdited();
                  forceRerender(n => n + 1);
                }
              }}
              placeholder={def || '(chiave sconosciuta)'}
              className={`flex-1 min-w-0 text-[11px] rounded-lg px-2 py-1 bg-white dark:bg-gray-900 border ${
                overridden ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {overridden && (
              <button
                onClick={() => { setTranslationValue(lang, labelKey, def); onEdited(); forceRerender(n => n + 1); }}
                className="shrink-0 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                title={`Ripristina al default: ${def}`}
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** One editable row: drag handle, icon picker, label fields, visibility toggle, inline translations. */
function ItemRow({
  item, onPatch, onTranslationEdited,
}: {
  item: NavConfigItem;
  onPatch: (patch: Partial<NavConfigItem>) => void;
  onTranslationEdited: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const isCategory = Boolean(item.category || item.children);
  const dev = item.visibility === 'dev';
  const [showTr, setShowTr] = useState(false);

  const hasLabelKey = Boolean(item.labelKey);
  const labelSource = item.label ? 'label' : hasLabelKey ? 'labelKey' : 'id';

  return (
    <div ref={setNodeRef} style={style} className="min-w-0">
      <div
        className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 bg-white dark:bg-gray-900 ${
          isCategory ? 'border-blue-200 dark:border-blue-900' : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing shrink-0"
          title="Trascina per riordinare"
        >
          <GripVertical size={16} />
        </button>

        <span className="shrink-0 text-gray-500 dark:text-gray-400">{navIcon(item.icon, 16)}</span>

        <select
          value={item.icon}
          onChange={e => onPatch({ icon: e.target.value })}
          className="shrink-0 w-28 text-[11px] bg-gray-100 dark:bg-gray-800 rounded-lg px-1.5 py-1 font-mono"
          title="Icona"
        >
          {NAV_ICON_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
          {!NAV_ICON_NAMES.includes(item.icon) && <option value={item.icon}>{item.icon} (?)</option>}
        </select>

        <div className="flex-1 min-w-0 flex items-center gap-1">
          <input
            value={item.labelKey ?? ''}
            onChange={e => onPatch({ labelKey: e.target.value })}
            placeholder="labelKey (i18n)"
            className={`flex-1 min-w-0 text-[11px] bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 font-mono ${
              labelSource === 'labelKey' ? 'ring-1 ring-blue-300 dark:ring-blue-800' : 'opacity-60'
            }`}
          />
          <button
            onClick={() => setShowTr(v => !v)}
            disabled={!hasLabelKey}
            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
            title={hasLabelKey ? 'Modifica traduzioni' : 'Nessun labelKey'}
          >
            <Languages size={13} />
          </button>
        </div>

        <input
          value={item.label ?? ''}
          onChange={e => onPatch({ label: e.target.value })}
          placeholder="label (fisso, ha priorità)"
          className={`flex-1 min-w-0 text-[11px] bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1 ${
            labelSource === 'label' ? 'ring-1 ring-blue-300 dark:ring-blue-800' : ''
          }`}
        />

        <span className="shrink-0 font-mono text-[10px] text-gray-400 w-24 truncate" title={item.id}>#{item.id}</span>

        <button
          onClick={() => onPatch({ visibility: dev ? 'always' : 'dev' })}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
            dev
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-transparent'
          }`}
          title={dev ? 'Visibile solo in DEV' : 'Sempre visibile'}
        >
          {dev ? <EyeOff size={11} /> : <Eye size={11} />}
          {dev ? 'dev' : 'always'}
        </button>
      </div>

      {showTr && hasLabelKey && (
        <TranslationEditor labelKey={item.labelKey!} onEdited={onTranslationEdited} />
      )}
    </div>
  );
}

export function DevNavPage({ onBack }: DevNavPageProps) {
  const { config, setConfig, resetDraft, isDirty } = useDevNavDraft();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [translationsDirty, setTranslationsDirty] = useState(false);
  // Recomputed every render — cheap (a few hundred string compares) and always current.
  const modifiedI18nCount = countModifiedKeys();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const containers = useMemo(() => containersOf(config), [config]);
  const categoryIds = useMemo(
    () => config.tree.filter(i => i.category || i.children).map(i => i.id),
    [config],
  );

  const containerOfId = (id: string): string => {
    if (containers[ROOT_CONTAINER].includes(id)) return ROOT_CONTAINER;
    for (const cid of categoryIds) {
      if (containers[cid]?.includes(id)) return cid;
    }
    return ROOT_CONTAINER;
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const from = containerOfId(activeIdStr);
    // `over` can be a container id (empty area) or an item id.
    const to = categoryIds.includes(overIdStr) || overIdStr === ROOT_CONTAINER
      ? overIdStr
      : containerOfId(overIdStr);
    if (from === to) return;

    const loc = locate(config, activeIdStr);
    if (!loc) return;
    if ((loc.item.category || loc.item.children) && to !== ROOT_CONTAINER) return; // categories stay in root

    const overList = containers[to] ?? [];
    const overIndex = overList.indexOf(overIdStr);
    const insertAt = overIndex >= 0 ? overIndex : overList.length;
    setConfig(moveItem(config, activeIdStr, to, insertAt));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (activeIdStr === overIdStr) return;

    const from = containerOfId(activeIdStr);
    const to = categoryIds.includes(overIdStr) || overIdStr === ROOT_CONTAINER
      ? overIdStr
      : containerOfId(overIdStr);
    if (from !== to) return; // cross-container already handled in onDragOver

    const list = containers[to] ?? [];
    const oldIndex = list.indexOf(activeIdStr);
    const newIndex = list.indexOf(overIdStr);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    // Rebuild the config from the reordered id list for this container.
    setConfig(applyOrder(config, to, reordered));
  };

  const patch = (id: string, p: Partial<NavConfigItem>) => setConfig(patchItem(config, id, p));

  const activeItem = activeId ? locate(config, activeId)?.item ?? null : null;

  const renderContainer = (containerId: string, items: NavConfigItem[], label?: string) => (
    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy} id={containerId}>
      <div className="flex flex-col gap-1.5" data-container={containerId}>
        {label && (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 pt-1">
            <FolderOpen size={11} /> {label}
          </p>
        )}
        {items.length === 0 && (
          <p className="text-[11px] text-gray-400 italic px-2 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center">
            Trascina qui una voce
          </p>
        )}
        {items.map(item => (
          <div key={item.id}>
            <ItemRow
              item={item}
              onPatch={p => patch(item.id, p)}
              onTranslationEdited={() => setTranslationsDirty(true)}
            />
            {(item.category || item.children) && (
              <div className="ml-6 mt-1.5 pl-2 border-l-2 border-blue-100 dark:border-blue-900">
                {renderContainer(item.id, item.children ?? [])}
              </div>
            )}
          </div>
        ))}
      </div>
    </SortableContext>
  );

  return (
    <DevStudioLayout
      title="Gestione Navigazione"
      subtitle="Editor drag&drop del menu di navigazione (nav.json) — non il menu contestuale '…', che è guidato da azioni. Le modifiche sono una bozza locale: scarica il file e committalo."
      icon={<Route size={20} className="text-purple-500" />}
      onBack={onBack}
      headerActions={
        <>
          {translationsDirty && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-xl transition-colors cursor-pointer"
              title="Ricarica per applicare le traduzioni modificate"
            >
              <RefreshCw size={14} /> Ricarica
            </button>
          )}
          <button
            type="button"
            onClick={resetDraft}
            disabled={!isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            title="Ripristina la bozza a nav.json"
          >
            <RotateCcw size={14} /> Ripristina
          </button>
          <button
            type="button"
            onClick={() => download(config)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors cursor-pointer"
            title="Scarica nav.json"
          >
            <Download size={14} /> nav.json
          </button>
        </>
      }
      sidebar={
        <div className="p-4 text-xs text-gray-500 dark:text-gray-400 space-y-2">
          <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <ChevronRight size={13} /> Come funziona
          </p>
          <p>Trascina per riordinare. Sposta una voce dentro/fuori una categoria trascinandola nell'area corrispondente.</p>
          <p>Le categorie restano al livello root.</p>
          <p><code>label</code> (fisso, non tradotto) <strong>ha priorità</strong> quando valorizzato. Lascialo vuoto per usare <code>labelKey</code>.</p>
          <p><code>labelKey</code> è la chiave i18n: usa il pulsante <Languages size={11} className="inline" /> per modificarne le traduzioni IT/EN qui (effettive al reload).</p>
          <p>Il toggle <span className="font-bold text-amber-600">dev</span> nasconde la voce dal menu in produzione (non blocca l'URL — quello è <code>UNRELEASED_ROUTES</code>).</p>
          <p className="pt-2 text-amber-600 dark:text-amber-500">La bozza <code>nav.json</code> è attiva subito nel menu live; le traduzioni richiedono un reload.</p>

          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <FileCode size={13} /> Esporta traduzioni
              {modifiedI18nCount > 0 && (
                <span className="px-1.5 py-px rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  {modifiedI18nCount}
                </span>
              )}
            </p>
            <p>Rigenera i file locale completi dalla bozza i18n (stessa logica di <em>Dev i18n Studio</em>). Sostituisci i file in <code>src/i18n/locales/</code> e committa.</p>
            <div className="flex gap-2">
              <button
                onClick={() => downloadLocaleFile('it')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Download size={12} /> it.ts
              </button>
              <button
                onClick={() => downloadLocaleFile('en')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Download size={12} /> en.ts
              </button>
            </div>
          </div>
        </div>
      }
      previewTitle="nav.json"
      previewContent={<pre className="whitespace-pre-wrap">{JSON.stringify(config, null, 2)}</pre>}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {renderContainer(ROOT_CONTAINER, config.tree)}
        <DragOverlay>
          {activeItem && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-400 px-2 py-1.5 bg-white dark:bg-gray-900 shadow-lg">
              <GripVertical size={16} className="text-gray-400" />
              {navIcon(activeItem.icon, 16)}
              <span className="text-xs font-bold">{activeItem.label || activeItem.labelKey || activeItem.id}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DevStudioLayout>
  );
}

/** Reorders one container's items to match `orderedIds`, returning a new config. */
function applyOrder(config: NavConfig, container: string, orderedIds: string[]): NavConfig {
  const next: NavConfig = JSON.parse(JSON.stringify(config));
  if (container === ROOT_CONTAINER) {
    const byId = new Map(next.tree.map(i => [i.id, i]));
    next.tree = orderedIds.map(id => byId.get(id)!).filter(Boolean);
  } else {
    const parent = next.tree.find(t => t.id === container);
    if (parent) {
      const byId = new Map((parent.children ?? []).map(i => [i.id, i]));
      parent.children = orderedIds.map(id => byId.get(id)!).filter(Boolean);
    }
  }
  return next;
}
