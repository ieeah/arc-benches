import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Check, Download, ImageOff, PackagePlus, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import type { ItemInfo, ItemTranslation } from '@/types';
import { useAppStore } from '@/store';
import { DevStudioLayout } from '@/components/DevStudioLayout';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { ApplyToProjectButton } from '@/components/dev/ApplyToProjectButton';
import itemsData from '@/data/items.json';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { downloadTextFile } from '@/lib/devI18n';
import { getCategoryIconPath, getFallbackItemIcon } from '@/lib/categoryIcons';
import { getRarityText } from '@/lib/rarity';
import {
  CUSTOM_ITEMS_FILE,
  ICON_EXTENSIONS,
  MAX_ICON_BYTES,
  RARITIES,
  baselineCustomItems,
  buildCustomItemsFileContent,
  clearCustomItemsDraft,
  emptyCustomItem,
  differsFromBaseline,
  isMetaForgeCollision,
  isValidItemId,
  readCustomItemsDraft,
  validateCustomItem,
  writeCustomItemsDraft,
  type CustomItemDef,
  type CustomItemsMap,
} from '@/lib/customItems';
import { cn } from '@/lib/cn';

interface DevCustomItemsPageProps {
  onBack: () => void;
}

const catalog = itemsData as unknown as Record<string, ItemInfo>;
const CATALOG_IDS: ReadonlySet<string> = new Set(Object.keys(catalog));
const BASELINE_IDS: ReadonlySet<string> = new Set(Object.keys(baselineCustomItems));
const LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'en');

const distinct = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b));

const ITEM_TYPES = distinct(Object.values(catalog).map((i) => i.item_type));
const WORKBENCHES = distinct(Object.values(catalog).map((i) => i.workbench));
const LOOT_AREAS = distinct(Object.values(catalog).map((i) => i.loot_area));
const SUBCATEGORIES_BY_TYPE: Record<string, string[]> = {};
for (const item of Object.values(catalog)) {
  const type = item.item_type?.trim();
  const sub = item.subcategory?.trim();
  if (!type || !sub) continue;
  (SUBCATEGORIES_BY_TYPE[type] ??= []);
  if (!SUBCATEGORIES_BY_TYPE[type].includes(sub)) SUBCATEGORIES_BY_TYPE[type].push(sub);
}

const MIME_TO_EXT: Record<string, (typeof ICON_EXTENSIONS)[number]> = {
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

const inputClass =
  'w-full bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500';
const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-gray-400';

/** Quale livello della catena di fallback userà l'app per un oggetto senza icona propria. */
function fallbackLevel(type: string, subcategory: string): string {
  const typePath = getCategoryIconPath(type, '');
  const subPath = getCategoryIconPath(type, subcategory);
  if (subcategory && subPath && subPath !== typePath) return 'icona della sottocategoria';
  if (typePath) return 'icona della categoria';
  return 'icona generica';
}

const toNumberOrNull = (raw: string): number | null => (raw.trim() === '' ? null : Number(raw));

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-gray-400">{hint}</span>}
    </label>
  );
}

export function DevCustomItemsPage({ onBack }: DevCustomItemsPageProps) {
  const [items, setItems] = useState<CustomItemsMap>(() => readCustomItemsDraft()?.items ?? baselineCustomItems);
  const [icons, setIcons] = useState<Record<string, string>>(() => readCustomItemsDraft()?.icons ?? {});
  const [selectedId, setSelectedId] = useState<string | null>(() => Object.keys(readCustomItemsDraft()?.items ?? baselineCustomItems)[0] ?? null);
  const [search, setSearch] = useState('');
  const [newId, setNewId] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'reset' | null>(null);

  const syncItemsOverrides = useAppStore((s) => s.syncItemsOverrides);

  // La bozza entra nel catalogo dello store (ItemPicker, Catalog Lab…) senza ricaricare la pagina
  useEffect(() => {
    writeCustomItemsDraft({ items, icons });
    syncItemsOverrides?.();
  }, [items, icons, syncItemsOverrides]);

  const ids = useMemo(
    () => Object.keys(items).filter((id) => !search.trim() || `${id} ${items[id].name}`.toLowerCase().includes(search.trim().toLowerCase())),
    [items, search],
  );
  const selected: CustomItemDef | null = selectedId ? items[selectedId] ?? null : null;
  const issues = useMemo(
    () => Object.fromEntries(Object.values(items).map((def) => [def.id, validateCustomItem(def, CATALOG_IDS, BASELINE_IDS)])),
    [items],
  );
  const json = useMemo(() => buildCustomItemsFileContent(items), [items]);
  const modified = useMemo(() => differsFromBaseline({ items, icons }), [items, icons]);

  const newIdError = !newId ? '' : !isValidItemId(newId) ? 'Usa hyphen-case (es. metal-parts).' : items[newId] ? 'Id già presente tra gli oggetti custom.' : '';

  const update = (id: string, patch: Partial<CustomItemDef>) =>
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const updateTranslation = (id: string, lang: string, patch: Partial<ItemTranslation>) =>
    setItems((prev) => {
      const current = prev[id].translations?.[lang] ?? { name: '', description: '' };
      return { ...prev, [id]: { ...prev[id], translations: { ...prev[id].translations, [lang]: { ...current, ...patch } } } };
    });

  const createItem = () => {
    if (!newId || newIdError) return;
    setItems((prev) => ({ ...prev, [newId]: emptyCustomItem(newId) }));
    setSelectedId(newId);
    setNewId('');
  };

  const removeItem = (id: string) => {
    const iconName = items[id]?.icon;
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (iconName) setIcons((prev) => Object.fromEntries(Object.entries(prev).filter(([name]) => name !== iconName)));
    setSelectedId(Object.keys(items).find((other) => other !== id) ?? null);
  };

  const uploadIcon = (id: string, file: File | undefined) => {
    setUploadError('');
    if (!file) return;
    const ext = MIME_TO_EXT[file.type];
    if (!ext) return setUploadError('Formato non supportato: usa PNG, SVG o WebP.');
    if (file.size > MAX_ICON_BYTES) return setUploadError('Icona troppo grande (massimo 512 KB).');
    const reader = new FileReader();
    reader.onload = () => {
      const name = `${id}.${ext}`;
      const previous = items[id]?.icon;
      setIcons((prev) => {
        const next = Object.fromEntries(Object.entries(prev).filter(([n]) => n !== previous));
        next[name] = String(reader.result);
        return next;
      });
      update(id, { icon: name });
    };
    reader.readAsDataURL(file);
  };

  const removeIcon = (id: string) => {
    const name = items[id]?.icon;
    update(id, { icon: '' });
    if (name) setIcons((prev) => Object.fromEntries(Object.entries(prev).filter(([n]) => n !== name)));
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* appunti non disponibili */ }
  };

  const reset = () => {
    clearCustomItemsDraft();
    window.location.reload();
  };

  // Anteprima: icona caricata > icona già nel catalogo > catena di fallback dell'app
  const previewIcon = selected
    ? (selected.icon && icons[selected.icon]) || (selected.icon && catalog[selected.id]?.icon) || getFallbackItemIcon(selected.item_type, selected.subcategory)
    : null;
  const hasOwnIcon = Boolean(selected?.icon && (icons[selected.icon] || catalog[selected.id]?.icon));
  const collision = selected ? isMetaForgeCollision(selected.id, CATALOG_IDS, BASELINE_IDS) : false;
  const selectedIssues = selected ? issues[selected.id] : null;

  return (
    <DevStudioLayout
      title="Custom Items Studio"
      subtitle="Oggetti di gioco assenti da MetaForge, con icona e traduzioni. Dopo averli applicati rilancia fetch-items e fetch-translations."
      icon={<PackagePlus size={20} className="text-rose-500" />}
      onBack={onBack}
      headerActions={
        <>
          <button
            type="button"
            onClick={() => setConfirm('reset')}
            disabled={!modified}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            <RotateCcw size={14} /> Ripristina
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copiato!' : 'Copia'}
          </button>
          <button
            type="button"
            onClick={() => downloadTextFile('items.json', json, 'application/json')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors cursor-pointer shadow-sm"
            title="Scarica items.json: va in scripts/data/custom-items/ insieme alle icone"
          >
            <Download size={14} /> items.json
          </button>
          <ApplyToProjectButton artifactIds={['custom-items']} label="Applica al file" disabled={!modified} />
        </>
      }
      sidebar={
        <div className="p-4 space-y-4 text-xs">
          <div className="space-y-1.5">
            <span className={cn(labelClass, 'flex items-center gap-1')}><Search size={11} /> Cerca</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Id o nome…" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <span className={labelClass}>Nuovo oggetto</span>
            <div className="flex gap-1.5">
              <input
                value={newId}
                onChange={(e) => setNewId(e.target.value.trim())}
                onKeyDown={(e) => e.key === 'Enter' && createItem()}
                placeholder="id-in-hyphen-case"
                className={cn(inputClass, 'font-mono')}
              />
              <button
                type="button"
                onClick={createItem}
                disabled={!newId || Boolean(newIdError)}
                className="shrink-0 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-40 cursor-pointer"
                aria-label="Crea oggetto"
              >
                <Plus size={14} />
              </button>
            </div>
            {newIdError && <p className="text-[10px] text-red-500">{newIdError}</p>}
          </div>

          <ul className="space-y-1">
            {ids.map((id) => {
              const def = items[id];
              const hasError = issues[id].errors.length > 0;
              const hasWarning = issues[id].warnings.length > 0;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(id)}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl text-left flex items-center gap-2 cursor-pointer transition-colors',
                      selectedId === id
                        ? 'bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent',
                    )}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold truncate">{def.name || id}</span>
                      <span className="block text-[10px] font-mono text-gray-400 truncate">{id}</span>
                    </span>
                    {!BASELINE_IDS.has(id) && <span className="text-[9px] font-black uppercase text-emerald-600">nuovo</span>}
                    {(hasError || hasWarning) && (
                      <AlertTriangle size={13} className={hasError ? 'text-red-500' : 'text-amber-500'} />
                    )}
                  </button>
                </li>
              );
            })}
            {ids.length === 0 && <li className="text-gray-400 px-1">Nessun oggetto.</li>}
          </ul>
        </div>
      }
      previewTitle="items.json"
      previewBadge={modified ? 'Modificato' : 'Invariato'}
      previewContent={<pre className="whitespace-pre-wrap">{json}</pre>}
    >
      {!selected ? (
        <div className="p-12 text-center text-sm text-gray-400">Seleziona un oggetto o creane uno nuovo dalla barra laterale.</div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="sr-only">{CUSTOM_ITEMS_FILE}</p>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 flex items-center gap-4">
            <ItemCardFrameV2
              icon={previewIcon}
              alt={selected.name}
              rarity={selected.rarity}
              fallbackText={selected.id}
              className="w-16 h-16 shrink-0"
              imgClassName="max-w-[85%] max-h-[85%] object-contain"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black truncate">{selected.name || selected.id}</h2>
                <span className={cn('text-xs font-bold', getRarityText(selected.rarity))}>{selected.rarity}</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {hasOwnIcon
                  ? 'Icona propria'
                  : `Nessuna icona propria: l'app userà l'${fallbackLevel(selected.item_type, selected.subcategory)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirm('delete')}
              className="shrink-0 p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              title="Elimina oggetto"
              aria-label="Elimina oggetto"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {(collision || (selectedIssues && (selectedIssues.errors.length > 0 || selectedIssues.warnings.length > 0))) && (
            <div className="space-y-2">
              {selectedIssues?.errors.map((message) => (
                <p key={message} className="p-3 rounded-2xl text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60">{message}</p>
              ))}
              {selectedIssues?.warnings.map((message) => (
                <p key={message} className="p-3 rounded-2xl text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">{message}</p>
              ))}
              {collision && (
                <button
                  type="button"
                  onClick={() => setConfirm('delete')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  Rimuovi la voce custom
                </button>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Id">
              <input value={selected.id} readOnly className={cn(inputClass, 'font-mono opacity-70')} title="Per cambiare id elimina l'oggetto e ricrealo" />
            </Field>
            <Field label="Rarità">
              <select value={selected.rarity} onChange={(e) => update(selected.id, { rarity: e.target.value })} className={inputClass}>
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Nome (EN)">
              <input value={selected.name} onChange={(e) => update(selected.id, { name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Tipo" hint="Scegli un tipo esistente o scrivine uno nuovo.">
              <input list="custom-item-types" value={selected.item_type} onChange={(e) => update(selected.id, { item_type: e.target.value, subcategory: '' })} className={inputClass} />
              <datalist id="custom-item-types">{ITEM_TYPES.map((t) => <option key={t} value={t} />)}</datalist>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descrizione (EN)">
                <textarea value={selected.description} onChange={(e) => update(selected.id, { description: e.target.value })} rows={3} className={inputClass} />
              </Field>
            </div>
            <Field label="Sottocategoria">
              <input list="custom-item-subcategories" value={selected.subcategory} onChange={(e) => update(selected.id, { subcategory: e.target.value })} className={inputClass} />
              <datalist id="custom-item-subcategories">{(SUBCATEGORIES_BY_TYPE[selected.item_type] ?? []).map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Banco">
              <input list="custom-item-workbenches" value={selected.workbench ?? ''} onChange={(e) => update(selected.id, { workbench: e.target.value || null })} className={inputClass} />
              <datalist id="custom-item-workbenches">{WORKBENCHES.map((w) => <option key={w} value={w} />)}</datalist>
            </Field>
            <Field label="Zona di loot">
              <input list="custom-item-loot-areas" value={selected.loot_area} onChange={(e) => update(selected.id, { loot_area: e.target.value })} className={inputClass} />
              <datalist id="custom-item-loot-areas">{LOOT_AREAS.map((a) => <option key={a} value={a} />)}</datalist>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valore">
                <input type="number" min={0} value={selected.value ?? ''} onChange={(e) => update(selected.id, { value: toNumberOrNull(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="Stack">
                <input type="number" min={1} value={selected.stack_size ?? ''} onChange={(e) => update(selected.id, { stack_size: toNumberOrNull(e.target.value) })} className={inputClass} />
              </Field>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4">
            <h3 className={labelClass}>Traduzioni</h3>
            {LANGUAGES.map((lang) => (
              <div key={lang.code} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={`Nome (${lang.code.toUpperCase()})`}>
                  <input value={selected.translations?.[lang.code]?.name ?? ''} onChange={(e) => updateTranslation(selected.id, lang.code, { name: e.target.value })} className={inputClass} />
                </Field>
                <Field label={`Descrizione (${lang.code.toUpperCase()})`}>
                  <textarea rows={2} value={selected.translations?.[lang.code]?.description ?? ''} onChange={(e) => updateTranslation(selected.id, lang.code, { description: e.target.value })} className={inputClass} />
                </Field>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-3">
            <h3 className={labelClass}>Icona</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              PNG, SVG o WebP fino a 512 KB. Senza icona propria l'app usa quella della sottocategoria, poi della categoria, poi quella generica.
              Con «Applica al file» l'icona viene scritta in <code className="font-mono">scripts/data/custom-items/</code>.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer">
                <Upload size={13} /> Carica icona
                <input type="file" accept=".png,.svg,.webp,image/png,image/svg+xml,image/webp" className="hidden" onChange={(e) => { uploadIcon(selected.id, e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {selected.icon && (
                <button
                  type="button"
                  onClick={() => removeIcon(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <ImageOff size={13} /> Rimuovi icona
                </button>
              )}
              {selected.icon && icons[selected.icon] && (
                <a
                  href={icons[selected.icon]}
                  download={selected.icon}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Download size={13} /> Scarica {selected.icon}
                </a>
              )}
              {selected.icon && <span className="text-[11px] font-mono text-gray-400">{selected.icon}</span>}
            </div>
            {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
          </div>
        </div>
      )}

      {confirm === 'delete' && selected && (
        <ConfirmActionModal
          title="Elimina oggetto custom"
          message={`Eliminare «${selected.name || selected.id}»?`}
          description="Controlla che non sia usato come ricompensa o requisito nelle liste. L'icona sorgente nel repository non viene cancellata."
          confirmText="Elimina"
          onConfirm={() => removeItem(selected.id)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'reset' && (
        <ConfirmActionModal
          title="Ripristina bozza"
          message="Scartare le modifiche agli oggetti custom?"
          description="Si torna al file incluso nell'app e la pagina viene ricaricata."
          confirmText="Ripristina"
          variant="warning"
          onConfirm={reset}
          onClose={() => setConfirm(null)}
        />
      )}
    </DevStudioLayout>
  );
}
