import { useState, useRef, useEffect, type ReactNode } from "react";
import { Pencil, Layers, MoreHorizontal, Trash2 } from "lucide-react";
import type { List } from "../types";
import { getBaseLevel } from "../lib/lists";
import { LevelBadge } from "./LevelBadge";
import { LevelPills } from "./LevelPills";
import { ActionCheckbox } from "./ActionCheckbox";

/** Goal card for a list. Pass `dragHandle` to render a sort handle (see SortableListRow). */
export const ListRow = ({
  list,
  current,
  isActive,
  inventory,
  otherNeeds,
  dragHandle,
  selectedTargets,
  checkedActions,
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
  /** Materials still required by the OTHER active goals (see getTotalRequiredMaterials(list.id)) */
  otherNeeds: Record<string, number>;
  dragHandle?: ReactNode;
  /** Levels selected as objectives for this list. */
  selectedTargets: number[];
  /** Checked state for checkbox actions, keyed by `${listId}|${level}|${actionId}`. */
  checkedActions?: Record<string, boolean>;
  onToggle: () => void;
  onCurrentLevel: (v: number, deductMaterials: boolean) => void;
  onToggleTarget: (level: number) => void;
  onToggleAction?: (level: number, actionId: string) => void;
  /** Opens the full list-detail page. */
  onOpenDetail?: () => void;
  /** When set (custom lists), renders an edit affordance opening the editor. */
  onEdit?: () => void;
  /** When set (custom lists), renders a delete affordance (inline confirm in the menu). */
  onDelete?: () => void;
}) => {
  const baseLevel = getBaseLevel(list);

  // Actions to surface on the card: those of every selected objective level (independent of current).
  const actionLevels = list.levels.filter(
    (l) => selectedTargets.includes(l.level) && (l.actions?.length ?? 0) > 0,
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Closing the menu always clears any pending delete confirmation.
  const closeMenu = () => { setMenuOpen(false); setConfirmingDelete(false); };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Level increase pending deduction confirmation
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);

  // Raising the level means the upgrade was paid in game, so tracked materials get deducted
  // automatically (missing ones were found and spent untracked: net zero). The question is asked
  // only on a real conflict: a tracked material that another active goal also needs might be
  // reserved for that goal rather than spent here.
  const hasConflict = (level: number) =>
    list.levels.some(
      (l) =>
        l.level > current &&
        l.level <= level &&
        l.requirementItemIds.some(
          (req) =>
            (inventory[req.itemId] ?? 0) > 0 &&
            (otherNeeds[req.itemId] ?? 0) > 0,
        ),
    );

  const handleCurrentLevel = (level: number) => {
    setPendingLevel(null);
    if (level <= current) {
      onCurrentLevel(level, false); // lowering never refunds: plain correction
    } else if (hasConflict(level)) {
      setPendingLevel(level); // ask before touching materials other goals may need
    } else {
      onCurrentLevel(level, true); // reconcile the inventory automatically
    }
  };

  const resolvePending = (deduct: boolean) => {
    if (pendingLevel !== null) onCurrentLevel(pendingLevel, deduct);
    setPendingLevel(null);
  };

  return (
    <div className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[24px] overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {dragHandle}
        <span className="font-bold flex-1 flex items-center gap-1.5 min-w-0">
          <span className="truncate">{list.name}</span>
          {list.custom && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full">
              Custom
            </span>
          )}
        </span>
        {(onOpenDetail || onEdit || onDelete) && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              title="Azioni lista"
              className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors rounded-full"
            >
              <MoreHorizontal size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden min-w-[10rem]">
                {onOpenDetail && (
                  <button
                    onClick={() => { closeMenu(); onOpenDetail(); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Layers size={15} className="text-gray-400 shrink-0" />
                    Dettaglio
                  </button>
                )}
                {onEdit && (
                  <>
                    {onOpenDetail && <div className="mx-3 h-px bg-gray-100 dark:bg-gray-700" />}
                    <button
                      onClick={() => { closeMenu(); onEdit(); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
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
                          <button
                            onClick={() => { closeMenu(); onDelete(); }}
                            className="flex-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full"
                          >
                            Elimina
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(false)}
                            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded-full"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
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
        <LevelBadge
          current={current}
          max={list.maxLevel}
          state={current >= list.maxLevel ? "maxed" : "default"}
        />
        <input
          type="checkbox"
          checked={isActive}
          onChange={onToggle}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
        />
      </div>

      <div className="px-4 pb-3 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">
            Livello Attuale
          </p>
          <LevelPills
            min={baseLevel}
            max={list.maxLevel}
            value={pendingLevel ?? current}
            activeClass={
              pendingLevel !== null
                ? "bg-blue-300 dark:bg-blue-700 text-white"
                : "bg-blue-500 text-white"
            }
            onChange={handleCurrentLevel}
          />
          {pendingLevel !== null && (
            <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
                Alcuni materiali in inventario servono anche ad altri banchi. Li
                hai usati per questo potenziamento?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => resolvePending(true)}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full"
                >
                  Sì, scala
                </button>
                <button
                  onClick={() => resolvePending(false)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-xs font-bold rounded-full"
                >
                  No, conservali
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">
            Livello Obiettivo
          </p>
          <LevelPills
            min={baseLevel}
            max={list.maxLevel}
            selected={selectedTargets}
            doneUpTo={current}
            activeClass="bg-green-500 text-white"
            onToggle={onToggleTarget}
          />
        </div>

        {actionLevels.length > 0 && onToggleAction && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
            {actionLevels.map((lvl) => (
              <div key={lvl.level}>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">
                  Azioni — Lvl {lvl.level}
                </p>
                <div className="space-y-1">
                  {lvl.actions!.map((action) => (
                    <ActionCheckbox
                      key={action.id}
                      label={action.label}
                      checked={
                        checkedActions?.[
                          `${list.id}|${lvl.level}|${action.id}`
                        ] ?? false
                      }
                      onToggle={() => onToggleAction(lvl.level, action.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
