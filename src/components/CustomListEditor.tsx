import { useState } from 'react';
import { X, Plus, Minus, Trash2, ListPlus } from 'lucide-react';
import type { ListLevel, ItemInfo } from '../types';
import { useAppStore } from '../store';
import { iconUrl } from '../lib/icons';
import { getRarityStyles } from '../lib/rarity';
import { IconButton } from './IconButton';
import { ItemPicker } from './ItemPicker';
import { useScrollLock } from '../hooks/useScrollLock';

/** Create or edit a custom list (multi-stage, mirrors the workbench engine). */
export const CustomListEditor = ({ listId, onClose }: {
  listId?: string; // undefined = new list
  onClose: () => void;
}) => {
  useScrollLock();
  const store = useAppStore();
  const existing = listId ? store.customLists.find(l => l.id === listId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [levels, setLevels] = useState<ListLevel[]>(
    existing?.levels ?? [{ level: 1, requirementItemIds: [] }]
  );
  const [pickerLevel, setPickerLevel] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const addLevel = () => setLevels(ls => [...ls, { level: ls.length + 1, requirementItemIds: [] }]);

  // Remove a stage and renumber the rest so levels stay contiguous 1..n
  const removeLevel = (levelNum: number) =>
    setLevels(ls => ls.filter(l => l.level !== levelNum).map((l, i) => ({ ...l, level: i + 1 })));

  const canSave = name.trim().length > 0 && levels.some(l => l.requirementItemIds.length > 0);

  const save = () => {
    if (!canSave) return;
    const cleanName = name.trim();
    // Drop trailing empty levels but keep the shape contiguous
    const kept = levels.filter(l => l.requirementItemIds.length > 0).map((l, i) => ({ ...l, level: i + 1 }));
    if (existing) store.updateCustomList(existing.id, { name: cleanName, levels: kept });
    else store.createCustomList({ name: cleanName, levels: kept });
    onClose();
  };

  const multiStage = levels.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">{existing ? 'Modifica lista' : 'Nuova lista'}</h2>
          <IconButton onClick={onClose} title="Chiudi">
            <X size={16} />
          </IconButton>
        </div>

        <div className="p-4 overflow-y-auto overscroll-contain space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Nome lista</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder="Es. Progetto armatura, Quest Celeste…"
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>

          {levels.map(lvl => (
            <div key={lvl.level} className="border border-gray-200 dark:border-gray-800 rounded-[20px] p-3">
              {multiStage && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Livello {lvl.level}</span>
                  <button onClick={() => removeLevel(lvl.level)}
                    className="text-gray-400 hover:text-red-500 transition-colors" title="Rimuovi livello">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

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
                {lvl.requirementItemIds.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">Nessun oggetto in questo livello.</p>
                )}
              </div>

              <button onClick={() => setPickerLevel(lvl.level)}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Plus size={14} />
                Aggiungi oggetto
              </button>
            </div>
          ))}

          <button onClick={addLevel}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <ListPlus size={15} />
            Aggiungi livello
          </button>
        </div>

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
      </div>

      {pickerLevel !== null && (
        <ItemPicker
          excludeIds={levels.find(l => l.level === pickerLevel)?.requirementItemIds.map(r => r.itemId)}
          onPick={item => addItem(pickerLevel, item)}
          onClose={() => setPickerLevel(null)}
        />
      )}
    </div>
  );
};
