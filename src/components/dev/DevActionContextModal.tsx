import { useState } from 'react';
import { Backpack, Check, MapPin, Plus, Trash2 } from 'lucide-react';
import type { ActionContext, CarryItem } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { Drawer } from '@/components/Drawer';
import { ItemPicker } from '@/components/ItemPicker';
import { GAME_MAPS } from '@/lib/maps';
import { cn } from '@/lib/cn';

export interface DevActionContextModalProps extends ActionContext {
  title: string;
  subtitle?: string;
  onSave: (context: ActionContext) => void;
  onClose: () => void;
}

/** Mappe in cui compiere un'azione (o uno step) e oggetti da portare in mappa. */
export function DevActionContextModal({ title, subtitle, maps = [], carryItems = [], onSave, onClose }: DevActionContextModalProps) {
  const { language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);
  const [selectedMaps, setSelectedMaps] = useState<string[]>(maps);
  const [carry, setCarry] = useState<CarryItem[]>(carryItems);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleMap = (id: string) =>
    setSelectedMaps((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const setQuantity = (index: number, quantity: number) =>
    setCarry((prev) => prev.map((c, i) => (i === index ? { ...c, quantity: Math.max(1, quantity || 1) } : c)));

  // Id non più nel catalogo (mappe future o rimosse) restano selezionabili finché presenti
  const unknownMaps = selectedMaps.filter((id) => !GAME_MAPS.some((m) => m.id === id));

  const save = () => {
    onSave({
      maps: selectedMaps.length > 0 ? selectedMaps : undefined,
      carryItems: carry.length > 0 ? carry : undefined,
    });
    onClose();
  };

  return (
    <>
      <Drawer from="bottom" title={title} onClose={onClose}>
        <div className="space-y-4 pb-4">
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>}

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <MapPin size={13} className="text-sky-500" /> Mappe richieste ({selectedMaps.length})
            </span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Nessuna selezionata = l'azione si può compiere in qualsiasi mappa.</p>
            <div className="flex flex-wrap gap-1.5">
              {[...GAME_MAPS.map((m) => ({ id: m.id, name: m.name })), ...unknownMaps.map((id) => ({ id, name: id }))].map((map) => {
                const active = selectedMaps.includes(map.id);
                return (
                  <button
                    key={map.id}
                    type="button"
                    onClick={() => toggleMap(map.id)}
                    aria-pressed={active}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors',
                      active
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-sky-400',
                    )}
                  >
                    {map.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Backpack size={13} className="text-amber-500" /> Oggetti da portare ({carry.length})
            </span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Solo informativi: non entrano nel fabbisogno dello Stash.</p>
            {carry.map((c, i) => {
              const info = itemsInfo[c.itemId];
              return (
                <div key={c.itemId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <span className="flex-1 min-w-0 text-xs font-semibold truncate">{info ? getItemName(info, language) || c.itemId : c.itemId}</span>
                  <input
                    type="number"
                    min={1}
                    value={c.quantity}
                    onChange={(e) => setQuantity(i, parseInt(e.target.value, 10))}
                    aria-label="Quantità"
                    className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setCarry((prev) => prev.filter((_, idx) => idx !== i))}
                    className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer"
                    title="Rimuovi oggetto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full py-2 border-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-500 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} /> Aggiungi oggetto da portare
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              Annulla
            </button>
            <button type="button" onClick={save} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Check size={13} strokeWidth={2.5} /> Conferma
            </button>
          </div>
        </div>
      </Drawer>

      {pickerOpen && (
        <ItemPicker
          excludeIds={carry.map((c) => c.itemId)}
          onPick={(item) => {
            setCarry((prev) => [...prev, { itemId: item.id, quantity: 1 }]);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
