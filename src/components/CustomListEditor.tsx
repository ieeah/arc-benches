import { useState } from 'react';
import { X, Plus, Trash2, Pencil, ListPlus, CheckSquare, Users } from 'lucide-react';
import type { ListLevel, ItemInfo, CheckboxAction } from '@/types';
import { useAppStore } from '@/store';
import { useTranslation, getItemName, getItemDescription, getRarityLabel } from '@/i18n';
import { generateUUID } from '@/lib/uuid';
import { ItemPicker } from '@/components/ItemPicker';
import { ActionCheckbox } from '@/components/ActionCheckbox';
import { BottomSheet } from '@/components/BottomSheet';
import { ItemCardFrameV2 } from '@/components/ItemCardFrameV2';
import { QuantityStepper } from '@/components/QuantityStepper';
import { getRarityText } from '@/lib/rarity';

const CustomListRequirementItem = ({
  itemId,
  quantity,
  info,
  onEdit,
  onRemove,
}: {
  itemId: string;
  quantity: number;
  info?: ItemInfo;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const { t, language } = useTranslation();
  const itemName = getItemName(info, language) || itemId;

  return (
    <div className="flex items-center gap-3 p-2 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
      <ItemCardFrameV2
        icon={info?.icon ?? null}
        alt={itemName}
        rarity={info?.rarity ?? 'Common'}
        fallbackText={itemId}
        className="w-11 h-11 shrink-0 rounded-xl"
        imgClassName="max-w-[85%] max-h-[85%] object-contain"
        compact
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
            {itemName}
          </p>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
            ×{quantity}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">{itemId}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="w-8 h-8 rounded-full bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title={t('common.edit')}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title={t('common.delete')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

const ItemQuantityModal = ({
  item,
  initialQuantity = 1,
  onConfirm,
  onClose,
}: {
  item: ItemInfo;
  initialQuantity?: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}) => {
  const { t, language } = useTranslation();
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [tempValue, setTempValue] = useState(String(quantity));

  const itemName = getItemName(item, language) || item.name;
  const itemDesc = getItemDescription(item, language);
  const rarityLabel = getRarityLabel(item.rarity, language);

  const handleTempValueChange = (val: string) => {
    setTempValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const handleBlur = () => {
    let parsed = parseInt(tempValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      parsed = 1;
    }
    setQuantity(parsed);
    setTempValue(String(parsed));
  };

  const adjustQty = (delta: number) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    setTempValue(String(next));
  };

  const setExact = (val: number) => {
    const next = Math.max(1, val);
    setQuantity(next);
    setTempValue(String(next));
  };

  return (
    <BottomSheet
      title={t('quantityModal.title')}
      onClose={onClose}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(quantity)}
            className="flex-2 py-3 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{t('quantityModal.addToList', { quantity })}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center py-2 space-y-4">
        {/* Item preview card */}
        <div className="w-full flex items-center gap-3.5 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-[22px] border border-gray-100 dark:border-gray-700/60">
          <ItemCardFrameV2
            icon={item.icon}
            alt={itemName}
            rarity={item.rarity}
            fallbackText={item.id}
            className="w-14 h-14 shrink-0 rounded-2xl shadow-2xs"
            imgClassName="max-w-[85%] max-h-[85%] object-contain"
            compact
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
              {itemName}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span className={`font-bold ${getRarityText(item.rarity)}`}>{rarityLabel}</span>
              {item.item_type ? ` · ${item.item_type}` : ''}
              {item.stack_size ? ` · Stack: ${item.stack_size}` : ''}
            </p>
            {itemDesc && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 mt-1">
                {itemDesc}
              </p>
            )}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="w-full flex flex-col items-center gap-3 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('quantityModal.requiredQty')}
          </label>
          <div className="w-48">
            <QuantityStepper
              orientation="horizontal"
              tempValue={tempValue}
              onTempValueChange={handleTempValueChange}
              onBlur={handleBlur}
              onIncrement={() => adjustQty(1)}
              onDecrement={() => adjustQty(-1)}
              rarity={item.rarity}
              itemName={itemName}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {[1, 2, 5, 10, 25, 50, 100].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setExact(val)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                  quantity === val
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {val}
              </button>
            ))}
            {item.stack_size && ![1, 2, 5, 10, 25, 50, 100].includes(item.stack_size) && (
              <button
                type="button"
                onClick={() => setExact(item.stack_size!)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
                  quantity === item.stack_size
                    ? 'bg-blue-500 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Stack ({item.stack_size})
              </button>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

const ConfirmDeleteItemModal = ({
  itemName,
  itemId,
  itemInfo,
  levelNum,
  onConfirm,
  onClose,
}: {
  itemName: string;
  itemId: string;
  itemInfo?: ItemInfo;
  levelNum: number;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const { t, language } = useTranslation();
  const localizedName = getItemName(itemInfo, language) || itemName;

  return (
    <BottomSheet
      title={t('customLists.deleteItemTitle')}
      onClose={onClose}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-full shadow-xs transition-colors"
          >
            {t('common.remove')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
        <ItemCardFrameV2
          icon={itemInfo?.icon ?? null}
          alt={localizedName}
          rarity={itemInfo?.rarity ?? 'Common'}
          fallbackText={itemId}
          className="w-14 h-14 shrink-0 rounded-2xl shadow-2xs"
          imgClassName="max-w-[85%] max-h-[85%] object-contain"
          compact
        />
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('customLists.deleteItemConfirm', { name: localizedName })}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('customLists.deleteItemStage', { level: levelNum })}
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};

/** Create or edit a custom list (multi-stage, mirrors the workbench engine). */
export const CustomListEditor = ({ listId, onClose }: {
  listId?: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
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
  const [itemToConfigure, setItemToConfigure] = useState<{ level: number; item: ItemInfo; initialQty: number } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ level: number; itemId: string; name: string; info?: ItemInfo } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingAction, setAddingAction] = useState<{ level: number; text: string } | null>(null);

  const updateLevel = (levelNum: number, items: ListLevel['requirementItemIds']) =>
    setLevels(ls => ls.map(l => (l.level === levelNum ? { ...l, requirementItemIds: items } : l)));

  const addItemWithQuantity = (levelNum: number, item: ItemInfo, quantity: number) => {
    const lvl = levels.find(l => l.level === levelNum);
    if (!lvl) return;
    const existingReq = lvl.requirementItemIds.find(r => r.itemId === item.id);
    updateLevel(levelNum, existingReq
      ? lvl.requirementItemIds.map(r => (r.itemId === item.id ? { ...r, quantity } : r))
      : [...lvl.requirementItemIds, { itemId: item.id, quantity }]);
    setItemToConfigure(null);
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
    const newAction: CheckboxAction = { id: generateUUID(), label: text };
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
        title={existing ? t('customLists.editTitle') : t('customLists.title')}
        onClose={onClose}
        bodyClassName="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4"
        footer={
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
            {existing && (
              confirmDelete ? (
                <button onClick={() => { store.deleteCustomList(existing.id); onClose(); }}
                  className="px-3 py-2.5 bg-red-500 text-white text-sm font-bold rounded-full shrink-0">
                  {t('common.confirm')}
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-11 h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-500 rounded-full shrink-0" title={t('common.delete')}>
                  <Trash2 size={17} />
                </button>
              )
            )}
            <button onClick={save} disabled={!canSave}
              className="flex-1 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-full disabled:opacity-40">
              {existing ? t('customLists.save') : t('customLists.create')}
            </button>
          </div>
        }
      >
        <div className="mb-4">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t('customLists.nameLabel')}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
            placeholder={t('customLists.namePlaceholder')}
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
                <p className="text-sm font-semibold">{t('customLists.sharedWithProfiles')}</p>
                <p className="text-[10px] text-gray-400">{t('customLists.sharedDesc')}</p>
              </div>
            </button>
            {shared && (
              <p className="mt-1.5 px-1 text-[11px] text-amber-500 dark:text-amber-400">
                {t('customLists.sharedWarning')}
              </p>
            )}
          </div>
        ) : existing.shared ? (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-blue-500 font-semibold px-1">
            <Users size={13} />
            {t('customLists.sharedWithProfiles')}
          </div>
        ) : null}

        {/* Insert before the first level */}
        <InsertDivider onInsert={() => insertLevelAt(0)} />

        {levels.map((lvl, idx) => (
          <div key={lvl.level}>
            <div className="border border-gray-200 dark:border-gray-800 rounded-[20px] p-3 mb-0">
              {multiStage && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">{t('benches.level')} {lvl.level}</span>
                  <button onClick={() => removeLevel(lvl.level)}
                    className="text-gray-400 hover:text-red-500 transition-colors" title={t('common.delete')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Material requirements */}
              <div className="space-y-1.5">
                {lvl.requirementItemIds.map(req => {
                  const info = store.itemsInfo[req.itemId];
                  return (
                    <CustomListRequirementItem
                      key={req.itemId}
                      itemId={req.itemId}
                      quantity={req.quantity}
                      info={info}
                      onEdit={() => {
                        const item = info || { id: req.itemId, name: req.itemId, rarity: 'Common' };
                        setItemToConfigure({
                          level: lvl.level,
                          item,
                          initialQty: req.quantity,
                        });
                      }}
                      onRemove={() => {
                        setItemToDelete({
                          level: lvl.level,
                          itemId: req.itemId,
                          name: info?.name ?? req.itemId,
                          info,
                        });
                      }}
                    />
                  );
                })}
                {lvl.requirementItemIds.length === 0 && (lvl.actions?.length ?? 0) === 0 && (
                  <p className="text-xs text-gray-400 italic py-1">{t('customLists.emptyStage')}</p>
                )}
              </div>

              <button onClick={() => setPickerLevel(lvl.level)}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <Plus size={14} />
                {t('customLists.addItem')}
              </button>

              {/* Checkbox actions — reflect (and let you toggle) the real completion state for saved lists */}
              {(lvl.actions?.length ?? 0) > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{t('benches.actions')}</p>
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
                    placeholder={t('customLists.actionPlaceholder')}
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
                  {t('customLists.addAction')}
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
          {t('customLists.addLevel')}
        </button>
      </BottomSheet>

      {pickerLevel !== null && (
        <ItemPicker
          excludeIds={levels.find(l => l.level === pickerLevel)?.requirementItemIds.map(r => r.itemId)}
          onPick={item => {
            const lvl = levels.find(l => l.level === pickerLevel);
            const existingReq = lvl?.requirementItemIds.find(r => r.itemId === item.id);
            setItemToConfigure({
              level: pickerLevel,
              item,
              initialQty: existingReq?.quantity ?? 1,
            });
          }}
          onClose={() => setPickerLevel(null)}
        />
      )}

      {itemToConfigure !== null && (
        <ItemQuantityModal
          item={itemToConfigure.item}
          initialQuantity={itemToConfigure.initialQty}
          onConfirm={qty => addItemWithQuantity(itemToConfigure.level, itemToConfigure.item, qty)}
          onClose={() => setItemToConfigure(null)}
        />
      )}

      {itemToDelete !== null && (
        <ConfirmDeleteItemModal
          itemName={itemToDelete.name}
          itemId={itemToDelete.itemId}
          itemInfo={itemToDelete.info}
          levelNum={itemToDelete.level}
          onConfirm={() => {
            setQty(itemToDelete.level, itemToDelete.itemId, 0);
            setItemToDelete(null);
          }}
          onClose={() => setItemToDelete(null)}
        />
      )}
    </>
  );
};

const InsertDivider = ({ onInsert }: { onInsert: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 my-1.5 px-1">
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      <button onClick={onInsert}
        className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-blue-500 px-2 py-0.5 rounded-full border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors">
        <Plus size={9} />
        {t('customLists.insertLevel')}
      </button>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
};



