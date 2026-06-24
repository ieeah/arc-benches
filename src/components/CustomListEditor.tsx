import { useState } from 'react';
import { X, Plus, Minus, Trash2, ListPlus, CheckSquare, Users } from 'lucide-react';
import type { ListLevel, ItemInfo, CheckboxAction } from '../types';
import { useAppStore } from '../store';
import { iconUrl } from '../lib/icons';
import { getRarityStyles } from '../lib/rarity';
import { ItemPicker } from './ItemPicker';
import { ActionCheckbox } from './ActionCheckbox';
import { BottomSheet } from './BottomSheet';

/** Create or edit a custom list (multi-stage, mirrors the workbench engine). */
export const CustomListEditor = ({ listId, onClose }: {
  listId?: string;
  onClose: () => void;
}) => {
  const store = useAppStore();
  const existing = listId
    ? store.customLists.find(l => l.id === listId) ?? store.sharedCustomLists.find(l => l.id === listId)
    : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [shared, setShared] = useState(existing?.shared ?? false);
  const [levels, setLevels] = useState<ListLevel[]>(
    existing?.levels ?? [{ level: 1, requirementItemIds: [] }]
  );
  const [pickerLevel, setPickerLevel] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingAction, setAddingAction] = useState<{ level: number; text: string } | null>(null);

  const updateLevel = (levelNum: number, items: ListLevel['requirementItemIds']) =>
    setLevels(ls => ls.map(l => (l.level === levelNum ? { ...l, requirementItemIds: items } : l)));

  const addItem = (levelNum: number, item: ItemInfo) => {
    const lvl = levels.find(l => l.level === levelNum);
    if (!lvl) return;
    const existingReq = lvl.requirementItemIds.find(r => r.itemId === item.id);
    updateLevel(levelNum, existingReq
      ? lvl.requirementItemIds.map(r => (r.itemId === item.id ? { ...r, quantity: r.quantity + 1 } : r))
      : [...lvl.requirementItemIds, { itemId: item.id, quantity: 1 }]);
    setPickerLevel(null);
  };

  const setQty = (levelNum: number, itemId: string, qty: number) => {
    const lvl = levels.find(l => l.level === levelNum);
    if (!lvl) return;
    updateLevel(levelNum, qty <= 0
      ? lvl.requirementItemIds.filter(r => r.itemId !== itemId)
      : lvl.requirementItemIds.map(r => (r.itemId === itemId ? { ...r, quantity: qty } : r)));
  };

  // Insert a new empty level immediately after `afterLevel` (0 = before the first level).
  const insertLevelAt = (afterLevel: number) =>
    setLevels(ls => {
      const shifted = ls.map(l => l.level > afterLevel ? { ...l, level: l.level + 1 } : l);
      return [...shifted, { level: afterLevel + 1, requirementItemIds: [] }]
        .sort((a, b) => a.level - b.level);
    });

  const addLevel = () => setLevels(ls => [...ls, { level: ls.length + 1, requirementItemIds: [] }]);

  // Remove a stage and renumber the rest so levels stay contiguous 1..n
  const removeLevel = (levelNum: number) =>
    setLevels(ls => ls.filter(l => l.level !== levelNum).map((l, i) => ({ ...l, level: i + 1 })));

  const commitAction = (levelNum: number) => {
    const text = addingAction?.text.trim() ?? '';
    if (!text) { setAddingAction(null); return; }
    const newAction: CheckboxAction = { id: crypto.randomUUID(), label: text };
    setLevels(ls => ls.map(l => l.level === levelNum
      ? { ...l, actions: [...(l.actions ?? []), newAction] }
      : l));
    setAddingAction(null);
  };

  const removeAction = (levelNum: number, actionId: string) =>
    setLevels(ls => ls.map(l => l.level === levelNum
      ? { ...l, actions: (l.actions ?? []).filter(a => a.id !== actionId) }
      : l));

  const canSave = name.trim().length > 0 &&
    levels.some(l => l.requirementItemIds.length > 0 || (l.actions?.length ?? 0) > 0);

  const save = () => {
    if (!canSave) return;
    const cleanName = name.trim();
    // Drop levels that are empty (no items, no actions) and renumber
    const kept = levels
      .filter(l => l.requirementItemIds.length > 0 || (l.actions?.length ?? 0) > 0)
      .map((l, i) => ({ ...l, level: i + 1 }));
    if (existing) store.updateCustomList(existing.id, { name: cleanName, levels: kept });
    else store.createCustomList({ name: cleanName, levels: kept, shared });
    onClose();
  };

  const multiStage = levels.length > 1;

  return (
    <>
      <BottomSheet
        title={existing ? 'Modifica lista' : 'Nuova lista'}
        onClose={onClose}
        bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4"
        footer={
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
            {existing && (
              confirmDelete ? (
                <button onClick={() => { store.deleteCustomList(existing.id); onClose(); }}
                  className="px-3 py-2.5 bg-red-500 text-white text-sm font-bold rounded-full shrink-0">
                  Conferma
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-11 h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-500 rounded-full shrink-0" title="Elimina lista">
                  <Trash2 size={17} />
                </button>
              )
            )}
            <button onClick={save} disabled={!canSave}
              className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-full disabled:opacity-40">
              {existing ? 'Salva modifiche' : 'Crea lista'}
            </button>
          </div>
        }
      >
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Nome lista</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
            placeholder="Es. Progetto armatura, Quest Celeste…"
            className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>

        {/* Shared toggle — immutable after creation */}
        {!existing ? (
          <div className="mb-4">
            <button type="button" onClick={() => setShared(v => !v)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-left">
              <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${shared ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${shared ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">Condividi con tutti i profili</p>
                <p className="text-[10px] text-gray-400">Visibile in tutti i profili, progresso separato</p>
              </div>
            </button>
            {shared && (
              <p className="mt-1.5 px-1 text-[11px] text-amber-500 dark:text-amber-400">
                Una lista condivisa non può essere resa privata in seguito. Per rimuoverla da un profilo specifico dovrai eliminarla da quel profilo.
              </p>
            )}
          </div>
        ) : existing.shared ? (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-blue-500 font-semibold px-1">
            <Users size={13} />
            Lista condivisa con tutti i profili
          </div>
        ) : null}

        {/* Insert before the first level */}
        <InsertDivider onInsert={() => insertLevelAt(0)} />

        {levels.map((lvl, idx) => (
          <div key={lvl.level}>
            <div className="border border-gray-200 dark:border-gray-800 rounded-[20px] p-3 mb-0">
              {multiStage && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Livello {lvl.level}</span>
                  <button onClick={() => removeLevel(lvl.level)}
                    className="text-gray-400 hover:text-red-500 transition-colors" title="Rimuovi livello">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Material requirements */}
              <div className="space-y-2">
                {lvl.requirementItemIds.map(req => {
                  const info = store.itemsInfo[req.itemId];
                  const { color } = getRarityStyles(info?.rarity ?? '');
                  return (
                    <div key={req.itemId} className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {info?.icon
                          ? <img src={iconUrl(info.icon)} alt={info.name} loading="lazy" decoding="async" className="max-w-[85%] max-h-[85%] object-contain" />
                          : <span className="text-[7px] text-gray-400">{req.itemId}</span>}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
                      </div>
                      <span className="flex-1 min-w-0 text-sm font-semibold truncate">{info?.name ?? req.itemId}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setQty(lvl.level, req.itemId, req.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Minus size={13} />
                        </button>
                        <input type="text" inputMode="numeric" value={req.quantity}
                          onChange={e => setQty(lvl.level, req.itemId, parseInt(e.target.value) || 0)}
                          className="w-10 text-center text-sm font-bold font-mono bg-transparent focus:outline-none" />
                        <button onClick={() => setQty(lvl.level, req.itemId, req.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {lvl.requirementItemIds.length === 0 && (lvl.actions?.length ?? 0) === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Nessun oggetto o azione in questo livello.</p>
                )}
              </div>

              <button onClick={() => setPickerLevel(lvl.level)}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Plus size={14} />
                Aggiungi oggetto
              </button>

              {/* Checkbox actions — reflect (and let you toggle) the real completion state for saved lists */}
              {(lvl.actions?.length ?? 0) > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Azioni</p>
                  {lvl.actions!.map(action => {
                    const checked = existing
                      ? store.checkedActions[`${existing.id}|${lvl.level}|${action.id}`] ?? false
                      : false;
                    return (
                      <div key={action.id} className="flex items-center gap-1">
                        <div className="flex-1 min-w-0">
                          <ActionCheckbox
                            label={action.label}
                            checked={checked}
                            onToggle={existing ? () => store.toggleAction(existing.id, lvl.level, action.id) : undefined}
                          />
                        </div>
                        <button onClick={() => removeAction(lvl.level, action.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1">
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {addingAction?.level === lvl.level ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={addingAction.text}
                    onChange={e => setAddingAction({ level: lvl.level, text: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitAction(lvl.level);
                      if (e.key === 'Escape') setAddingAction(null);
                    }}
                    placeholder="Descrizione azione…"
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button onClick={() => commitAction(lvl.level)}
                    className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-full">OK</button>
                  <button onClick={() => setAddingAction(null)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs rounded-full">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingAction({ level: lvl.level, text: '' })}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-full">
                  <CheckSquare size={13} />
                  Aggiungi azione
                </button>
              )}
            </div>

            {/* Insert between levels (not after the last one) */}
            {idx < levels.length - 1 && (
              <InsertDivider onInsert={() => insertLevelAt(lvl.level)} />
            )}
          </div>
        ))}

        <button onClick={addLevel}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl mt-2">
          <ListPlus size={15} />
          Aggiungi livello
        </button>
      </BottomSheet>

      {pickerLevel !== null && (
        <ItemPicker
          excludeIds={levels.find(l => l.level === pickerLevel)?.requirementItemIds.map(r => r.itemId)}
          onPick={item => addItem(pickerLevel, item)}
          onClose={() => setPickerLevel(null)}
        />
      )}
    </>
  );
};

const InsertDivider = ({ onInsert }: { onInsert: () => void }) => (
  <div className="flex items-center gap-2 my-1.5 px-1">
    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    <button onClick={onInsert}
      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-blue-500 px-2 py-0.5 rounded-full border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors">
      <Plus size={9} />
      Inserisci livello
    </button>
    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
  </div>
);
