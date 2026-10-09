import React, { useState } from 'react';
import { Plus, Trash2, Gift, Package, Check, Layers } from 'lucide-react';
import type { PassTrackDef, Reward } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName } from '@/i18n';
import { Drawer } from '@/components/Drawer';
import { ItemPicker } from '@/components/ItemPicker';
import { RewardBadge } from '@/components/RewardBadge';
import { getRarityStyles } from '@/lib/rarity';
import { iconUrl } from '@/lib/icons';
import { cn } from '@/lib/cn';

export interface DevRewardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  rewards?: Reward[];
  /** Tracce del Reward Pass: se presenti, ogni ricompensa appartiene a una traccia. */
  tracks?: PassTrackDef[];
  onSave: (rewards: Reward[]) => void;
}

export const DevRewardEditorModal: React.FC<DevRewardEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  rewards = [],
  tracks,
  onSave,
}) => {
  const { language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);

  const [currentRewards, setCurrentRewards] = useState<Reward[]>(rewards);

  // Item Reward state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [selectedTrack, setSelectedTrack] = useState<string | undefined>(tracks?.[0]?.id);
  const [itemPickerOpen, setItemPickerOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRemoveReward = (index: number) => {
    setCurrentRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItemReward = () => {
    if (!selectedItemId) return;
    const newReward: Reward = {
      itemId: selectedItemId,
      quantity: itemQuantity > 0 ? itemQuantity : 1,
      ...(tracks && selectedTrack ? { track: selectedTrack } : {}),
    };

    setCurrentRewards((prev) => [...prev, newReward]);
    setSelectedItemId(null);
    setItemQuantity(1);
  };

  const handleSaveAll = () => {
    onSave(currentRewards);
    onClose();
  };

  const trackName = (id?: string) => {
    const track = tracks?.find((t) => t.id === (id ?? tracks[0]?.id));
    return track ? track.translations?.[language]?.name || track.name : id ?? '';
  };

  const selectedItemInfo = selectedItemId ? itemsInfo[selectedItemId] : undefined;
  const selectedItemName = selectedItemInfo
    ? getItemName(selectedItemInfo, language) || selectedItemId
    : selectedItemId;
  const selectedItemRarity = selectedItemInfo ? getRarityStyles(selectedItemInfo.rarity ?? '') : null;

  return (
    <>
      <Drawer from="bottom" title={title} onClose={onClose}>
        <div className="space-y-4 pb-4">
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {subtitle}
            </p>
          )}

          {/* Current Rewards List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Gift size={13} className="text-violet-500" />
                Ricompense Assegnate ({currentRewards.length})
              </span>
            </div>

            {currentRewards.length === 0 ? (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
                Nessuna ricompensa assegnata a questo elemento.
              </div>
            ) : (
              <div className="space-y-1.5">
                {currentRewards.map((reward, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <RewardBadge reward={reward} size="sm" />
                      {tracks && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shrink-0">
                          {trackName(reward.track)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReward(idx)}
                      className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                      title="Rimuovi ricompensa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Reward Section */}
          <div className="p-3.5 bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1">
                <Plus size={13} /> Nuova Ricompensa
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                {selectedItemId ? (
                  <div className="flex-1 flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0">
                      {selectedItemInfo?.icon ? (
                        <img
                          src={iconUrl(selectedItemInfo.icon)}
                          alt={selectedItemName || ''}
                          className="max-w-[85%] max-h-[85%] object-contain"
                        />
                      ) : (
                        <Package size={14} className="text-gray-400" />
                      )}
                      {selectedItemRarity && (
                        <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', selectedItemRarity.color)} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                        {selectedItemName}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">
                        {selectedItemId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemPickerOpen(true)}
                      className="px-2 py-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                    >
                      Cambia
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setItemPickerOpen(true)}
                    className="flex-1 py-2.5 px-3 bg-white dark:bg-gray-800 border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Layers size={13} />
                    <span>Scegli Oggetto da Catalogo</span>
                  </button>
                )}

                <div className="w-20 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    placeholder="Qtà"
                    className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl text-xs font-mono font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {tracks && (
                <label className="flex items-center gap-2 text-xs font-bold text-violet-800 dark:text-violet-300">
                  <span className="shrink-0">Traccia</span>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl text-xs font-bold"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{trackName(t.id)}</option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="button"
                disabled={!selectedItemId}
                onClick={handleAddItemReward}
                className="w-full py-2 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Plus size={13} />
                <span>Aggiungi Oggetto come Ricompensa</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Check size={13} strokeWidth={2.5} />
              <span>Conferma Ricompense</span>
            </button>
          </div>
        </div>
      </Drawer>

      {/* Item Picker Overlay */}
      {itemPickerOpen && (
        <ItemPicker
          includeAll
          onPick={(item) => {
            setSelectedItemId(item.id);
            setItemPickerOpen(false);
          }}
          onClose={() => setItemPickerOpen(false)}
        />
      )}
    </>
  );
};
