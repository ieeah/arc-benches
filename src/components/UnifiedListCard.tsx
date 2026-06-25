import { useState, useRef, useEffect, type ReactNode } from 'react';
import { CheckCircle2, ChevronDown, Hammer, Layers, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ItemInfo, List } from '../types';
import { getBaseLevel } from '../lib/lists';
import { refinerCraftLevel } from '../lib/craft';
import { LevelBadge } from './LevelBadge';
import { LevelPills } from './LevelPills';
import { ActionCheckbox } from './ActionCheckbox';

const RequirementsGrid = ({
  levelData,
  currentLevelNum,
  itemsInfo,
  refinerLevel,
  inventory,
  totalRequired,
}: {
  levelData: List['levels'][number];
  currentLevelNum: number;
  itemsInfo: Record<string, ItemInfo>;
  refinerLevel: number;
  inventory: Record<string, number>;
  totalRequired: Record<string, number>;
}) => (
  <div>
    <p className="text-[9px] font-bold uppercase text-gray-400 mb-1.5 tracking-wider">
      Requisiti Lvl {currentLevelNum + 1}:
    </p>
    <div className="grid grid-cols-2 gap-1.5">
      {levelData.requirementItemIds.map(req => {
        const craftLevel = refinerCraftLevel(itemsInfo[req.itemId]);
        const craftableNow = craftLevel !== null && refinerLevel >= craftLevel;
        const owned = inventory[req.itemId] ?? 0;
        const collected = owned >= req.quantity && owned >= (totalRequired[req.itemId] ?? 0);
        return (
          <div key={req.itemId}
            className={`text-[10px] flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-xl gap-1 ${collected ? 'opacity-45' : ''}`}>
            <span className="truncate font-semibold capitalize flex items-center gap-1">
              {collected ? (
                <CheckCircle2 size={10} className="shrink-0 text-green-500" aria-label="Già raccolto" />
              ) : craftLevel !== null && (
                <Hammer size={10}
                  className={`shrink-0 ${craftableNow ? 'text-emerald-500' : 'text-amber-500'}`}
                  aria-label={craftableNow ? 'Craftabile nel Refiner' : `Richiede Refiner Lvl ${craftLevel}`} />
              )}
              {itemsInfo[req.itemId]?.name ?? req.itemId.replace(/-/g, ' ')}
            </span>
            <span className="font-mono font-bold text-xs shrink-0">{req.quantity}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export const UnifiedListCard = ({
  list,
  current,
  isActive,
  inventory,
  otherNeeds,
  dragHandle,
  selectedTargets,
  checkedActions,
  itemsInfo,
  refinerLevel,
  totalRequired,
  canUpgrade,
  onUpgrade,
  onToggle,
  onCurrentLevel,
  onToggleTarget,
  onToggleAction,
  onOpenDetail,
  onEdit,
  onDelete,
}: {
  list: List;
  current: number;
  isActive: boolean;
  inventory: Record<string, number>;
  otherNeeds: Record<string, number>;
  dragHandle?: ReactNode;
  selectedTargets: number[];
  checkedActions?: Record<string, boolean>;
  itemsInfo: Record<string, ItemInfo>;
  refinerLevel: number;
  totalRequired: Record<string, number>;
  canUpgrade: boolean;
  onUpgrade: () => void;
  onToggle: () => void;
  onCurrentLevel: (v: number, deductMaterials: boolean) => void;
  onToggleTarget: (level: number) => void;
  onToggleAction?: (level: number, actionId: string) => void;
  onOpenDetail?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const isMaxed = current >= list.maxLevel;
  const baseLevel = getBaseLevel(list);
  const nextLevelData = list.levels.find(l => l.level === current + 1);
  const hasCollapsedBody = !isMaxed;
  const hasMenu = onOpenDetail || onEdit || onDelete;

  const actionLevels = list.levels.filter(
    l => selectedTargets.includes(l.level) && (l.actions?.length ?? 0) > 0
  );

  const closeMenu = () => { setMenuOpen(false); setConfirmingDelete(false); };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const hasConflict = (level: number) =>
    list.levels.some(
      l => l.level > current && l.level <= level &&
        l.requirementItemIds.some(
          req => (inventory[req.itemId] ?? 0) > 0 && (otherNeeds[req.itemId] ?? 0) > 0
        )
    );

  const handleCurrentLevel = (level: number) => {
    setPendingLevel(null);
    if (level <= current) {
      onCurrentLevel(level, false);
    } else if (hasConflict(level)) {
      setPendingLevel(level);
    } else {
      onCurrentLevel(level, true);
    }
  };

  const resolvePending = (deduct: boolean) => {
    if (pendingLevel !== null) onCurrentLevel(pendingLevel, deduct);
    setPendingLevel(null);
  };

  const cardBorder = canUpgrade && !expanded
    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900';

  return (
    <div className={`mb-3 rounded-[24px] border-2 overflow-hidden transition-colors ${cardBorder}`}>
      {/* Header — expand trigger (name + badge + chevron) flanked by drag handle and menu */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2">
        {dragHandle}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <span className="font-bold text-base flex-1 flex items-center gap-1.5 min-w-0">
            <span className="truncate">{list.name}</span>
            {list.custom && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full">
                Custom
              </span>
            )}
          </span>
          <LevelBadge current={current} max={list.maxLevel} state={isMaxed ? 'maxed' : canUpgrade ? 'ready' : 'default'} />
          <ChevronDown
            size={16}
            className={`shrink-0 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {hasMenu && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
              title="Azioni lista"
              className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors rounded-full"
            >
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden min-w-[10rem]">
                {onOpenDetail && (
                  <button onClick={() => { closeMenu(); onOpenDetail(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Layers size={15} className="text-gray-400 shrink-0" />
                    Dettaglio
                  </button>
                )}
                {onEdit && (
                  <>
                    {onOpenDetail && <div className="mx-3 h-px bg-gray-100 dark:bg-gray-700" />}
                    <button onClick={() => { closeMenu(); onEdit(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <Pencil size={15} className="text-gray-400 shrink-0" />
                      Modifica
                    </button>
                  </>
                )}
                {onDelete && (
                  <>
                    {(onOpenDetail || onEdit) && <div className="mx-3 h-px bg-gray-100 dark:bg-gray-700" />}
                    {confirmingDelete ? (
                      <div className="px-3 py-2.5 space-y-1.5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Eliminare la lista?</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => { closeMenu(); onDelete(); }}
                            className="flex-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">Elimina</button>
                          <button onClick={() => setConfirmingDelete(false)}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded-full">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmingDelete(true)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={15} className="shrink-0" />
                        Elimina
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsed body: current level pills + requirements + upgrade button */}
      {!expanded && hasCollapsedBody && (
        <div className="px-4 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
            <LevelPills
              min={baseLevel}
              max={list.maxLevel}
              value={pendingLevel ?? current}
              activeClass={pendingLevel !== null ? 'bg-blue-300 dark:bg-blue-700 text-white' : 'bg-blue-500 text-white'}
              onChange={handleCurrentLevel}
            />
            {pendingLevel !== null && (
              <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                  Alcuni materiali in inventario servono anche ad altri banchi. Li hai usati per questo potenziamento?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => resolvePending(true)}
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">Sì, scala</button>
                  <button onClick={() => resolvePending(false)}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">No, conservali</button>
                </div>
              </div>
            )}
          </div>
          {nextLevelData && nextLevelData.requirementItemIds.length > 0 && (
            <RequirementsGrid
              levelData={nextLevelData}
              currentLevelNum={current}
              itemsInfo={itemsInfo}
              refinerLevel={refinerLevel}
              inventory={inventory}
              totalRequired={totalRequired}
            />
          )}
          {canUpgrade && (
            <button onClick={onUpgrade}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm">
              <CheckCircle2 size={16} />
              COMPLETA POTENZIAMENTO
            </button>
          )}
        </div>
      )}

      {/* Expanded body: pills + toggle + actions + requirements + upgrade button */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Attuale</p>
            <LevelPills
              min={baseLevel}
              max={list.maxLevel}
              value={pendingLevel ?? current}
              activeClass={pendingLevel !== null ? 'bg-blue-300 dark:bg-blue-700 text-white' : 'bg-blue-500 text-white'}
              onChange={handleCurrentLevel}
            />
            {pendingLevel !== null && (
              <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                  Alcuni materiali in inventario servono anche ad altri banchi. Li hai usati per questo potenziamento?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => resolvePending(true)}
                    className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">Sì, scala</button>
                  <button onClick={() => resolvePending(false)}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full">No, conservali</button>
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Livello Obiettivo</p>
            <LevelPills
              min={baseLevel}
              max={list.maxLevel}
              selected={selectedTargets}
              doneUpTo={current}
              activeClass="bg-green-500 text-white"
              onToggle={onToggleTarget}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-gray-400 flex-1">Attivo</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={onToggle}
              className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          {actionLevels.length > 0 && onToggleAction && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
              {actionLevels.map(lvl => (
                <div key={lvl.level}>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                    Azioni — Lvl {lvl.level}
                  </p>
                  <div className="space-y-1">
                    {lvl.actions!.map(action => (
                      <ActionCheckbox
                        key={action.id}
                        label={action.label}
                        checked={checkedActions?.[`${list.id}|${lvl.level}|${action.id}`] ?? false}
                        onToggle={() => onToggleAction(lvl.level, action.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isMaxed && (nextLevelData?.requirementItemIds.length ?? 0) > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <RequirementsGrid
                levelData={nextLevelData!}
                currentLevelNum={current}
                itemsInfo={itemsInfo}
                refinerLevel={refinerLevel}
                inventory={inventory}
                totalRequired={totalRequired}
              />
            </div>
          )}
          {!isMaxed && canUpgrade && (
            <button onClick={onUpgrade}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm">
              <CheckCircle2 size={16} />
              COMPLETA POTENZIAMENTO
            </button>
          )}
        </div>
      )}
    </div>
  );
};
