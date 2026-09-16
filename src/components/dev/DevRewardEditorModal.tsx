import React, { useState } from 'react';
import { Plus, Trash2, Gift, Package, FileText, Check, Layers } from 'lucide-react';
import type { Reward } from '@/types';
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
  onSave: (rewards: Reward[]) => void;
}

export const DevRewardEditorModal: React.FC<DevRewardEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  rewards = [],
  onSave,
}) => {
  const { language } = useTranslation();
  const itemsInfo = useAppStore((s) => s.itemsInfo);

  const [currentRewards, setCurrentRewards] = useState<Reward[]>(rewards);
  const [rewardType, setRewardType] = useState<'item' | 'custom'>('item');

  // Item Reward state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemPickerOpen, setItemPickerOpen] = useState<boolean>(false);

  // Custom Reward state
  const [customLabelEn, setCustomLabelEn] = useState<string>('');
  const [customLabelIt, setCustomLabelIt] = useState<string>('');
  const [customQuantity, setCustomQuantity] = useState<string>('');

  if (!isOpen) return null;

  const handleRemoveReward = (index: number) => {
    setCurrentRewards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItemReward = () => {
    if (!selectedItemId) return;
    const info = itemsInfo[selectedItemId];
    const defaultLabel = info ? info.name || selectedItemId : selectedItemId;
    const itName = info?.translations?.it?.name;

    const newReward: Reward = {
      itemId: selectedItemId,
      quantity: itemQuantity > 0 ? itemQuantity : 1,
      label: defaultLabel,
      ...(itName ? { translations: { it: { label: itName } } } : {}),
    };

    setCurrentRewards((prev) => [...prev, newReward]);
    setSelectedItemId(null);
    setItemQuantity(1);
  };

  const handleAddCustomReward = () => {
    const cleanEn = customLabelEn.trim();
    const cleanIt = customLabelIt.trim();
    if (!cleanEn) return;

    const qty = parseInt(customQuantity, 10);
    const newReward: Reward = {
      label: cleanEn,
      ...(qty > 0 ? { quantity: qty } : {}),
      ...(cleanIt ? { translations: { it: { label: cleanIt } } } : {}),
    };

    setCurrentRewards((prev) => [...prev, newReward]);
    setCustomLabelEn('');
    setCustomLabelIt('');
    setCustomQuantity('');
  };

  const handleSaveAll = () => {
    onSave(currentRewards);
    onClose();
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
                      {reward.translations?.it?.label && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                          (IT: {reward.translations.it.label})
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

              {/* Type Switcher */}
              <div className="flex items-center p-0.5 bg-white dark:bg-gray-800 rounded-xl border border-violet-200 dark:border-violet-800/60 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRewardType('item')}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer',
                    rewardType === 'item'
                      ? 'bg-violet-600 text-white shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900',
                  )}
                >
                  <Package size={11} />
                  <span>Oggetto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRewardType('custom')}
                  className={cn(
                    'px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer',
                    rewardType === 'custom'
                      ? 'bg-violet-600 text-white shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900',
                  )}
                >
                  <FileText size={11} />
                  <span>Testo / Altro</span>
                </button>
              </div>
            </div>

            {/* Item Mode */}
            {rewardType === 'item' && (
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
            )}

            {/* Custom Mode */}
            {rewardType === 'custom' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                      Descrizione EN (Default)*
                    </label>
                    <input
                      type="text"
                      value={customLabelEn}
                      onChange={(e) => setCustomLabelEn(e.target.value)}
                      placeholder="es. +150 Raider Tokens"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                      Descrizione IT (Opzionale)
                    </label>
                    <input
                      type="text"
                      value={customLabelIt}
                      onChange={(e) => setCustomLabelIt(e.target.value)}
                      placeholder="es. +150 Token Raider"
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    placeholder="Quantità numerica (opzionale, es. 150)"
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-violet-300 dark:border-violet-700 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    disabled={!customLabelEn.trim()}
                    onClick={handleAddCustomReward}
                    className="px-4 py-1.5 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
                  >
                    <Plus size={13} />
                    <span>Aggiungi</span>
                  </button>
                </div>
              </div>
            )}
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
