import React from 'react';
import type { SkillNode } from '@/types';
import { useTranslation } from '@/i18n';
import { Lock, Plus, Minus, Zap, X, ShieldAlert } from 'lucide-react';
import { BRANCH_CONFIGS } from './types';
import { canAllocatePoint, canDecrementPoint, calculateSkillBudget } from '@/lib/skillTree';
import { useAppStore } from '@/store';
import skillsData from '@/data/skills.json';

const allNodes = skillsData as SkillNode[];
const nodeMap = new Map<string, SkillNode>(allNodes.map((n) => [n.id, n]));

type SkillDetailSheetProps = {
  selectedSlotId: string | null;
  onClose: () => void;
};

export const SkillDetailSheet: React.FC<SkillDetailSheetProps> = ({
  selectedSlotId,
  onClose,
}) => {
  const { language } = useTranslation();
  const lang = (language === 'it' ? 'it' : 'en') as 'it' | 'en';

  const skillAllocations = useAppStore((s) => s.skillAllocations);
  const raiderLevel = useAppStore((s) => s.raiderLevel);
  const earnedPermanentSkillPoints = useAppStore((s) => s.earnedPermanentSkillPoints);
  const useExpeditionBonus = useAppStore((s) => s.useExpeditionBonus);
  const sandboxMode = useAppStore((s) => s.sandboxMode);

  const allocateSkillPoint = useAppStore((s) => s.allocateSkillPoint);
  const decrementSkillPoint = useAppStore((s) => s.decrementSkillPoint);
  const autoAllocatePath = useAppStore((s) => s.autoAllocatePath);

  if (!selectedSlotId) return null;

  const budget = calculateSkillBudget(
    raiderLevel,
    earnedPermanentSkillPoints,
    useExpeditionBonus,
    sandboxMode,
    skillAllocations
  );

  // Check if slot is mid milestone (e.g. cond_4, mob_4, surv_4)
  const isMidMilestone =
    selectedSlotId === 'cond_4' || selectedSlotId === 'mob_4' || selectedSlotId === 'surv_4';

  let primaryNode: SkillNode | undefined;
  let choiceNodes: SkillNode[] = [];

  if (isMidMilestone) {
    const prefix = selectedSlotId.slice(0, 4); // 'cond' | 'mob_' | 'surv'
    const lNode = nodeMap.get(`${prefix}l`);
    const rNode = nodeMap.get(`${prefix}r`);
    choiceNodes = [lNode, rNode].filter((n): n is SkillNode => n !== undefined);
    primaryNode = choiceNodes[0];
  } else {
    primaryNode = nodeMap.get(selectedSlotId);
  }

  if (!primaryNode) return null;

  const branchCfg = BRANCH_CONFIGS[primaryNode.category];

  // Helper to render single node control
  const renderNodeControls = (node: SkillNode) => {
    const currentPoints = skillAllocations[node.id] || 0;
    const isMaxed = currentPoints >= node.maxPoints;
    const canAlloc = canAllocatePoint(node.id, skillAllocations, budget, nodeMap);
    const canDec = canDecrementPoint(node.id, skillAllocations, nodeMap);

    const handleAllocate = () => {
      allocateSkillPoint(node.id);
    };

    const handleDecrement = () => {
      decrementSkillPoint(node.id);
    };

    const handleMaxOut = () => {
      for (let i = currentPoints; i < node.maxPoints; i++) {
        const ok = allocateSkillPoint(node.id);
        if (!ok) break;
      }
    };

    // In-game style requirement messages
    let lockMessage: string | null = null;
    if (!canAlloc.allowed) {
      if (canAlloc.reason === 'gate_locked_10') {
        lockMessage =
          lang === 'it'
            ? `RICHIEDE 10 PUNTI IN ${branchCfg.nameIt}`
            : `REQUIRES 10 POINTS IN ${branchCfg.name.toUpperCase()}`;
      } else if (canAlloc.reason === 'gate_locked_30') {
        lockMessage =
          lang === 'it'
            ? `RICHIEDE 30 PUNTI IN ${branchCfg.nameIt}`
            : `REQUIRES 30 POINTS IN ${branchCfg.name.toUpperCase()}`;
      } else if (canAlloc.reason === 'gate_locked_40') {
        lockMessage =
          lang === 'it'
            ? `RICHIEDE 40 PUNTI IN ${branchCfg.nameIt}`
            : `REQUIRES 40 POINTS IN ${branchCfg.name.toUpperCase()}`;
      } else if (canAlloc.reason === 'missing_prerequisite') {
        lockMessage =
          lang === 'it'
            ? 'Richiede almeno 1 punto nel nodo precedente'
            : 'Requires at least 1 point in prerequisite node';
      } else if (canAlloc.reason === 'insufficient_points') {
        lockMessage =
          lang === 'it' ? 'Punti abilità esauriti' : 'No available skill points';
      }
    }

    return (
      <div key={node.id} className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        {/* If node is one of multiple choices */}
        {choiceNodes.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm tracking-wide text-zinc-900 dark:text-zinc-100 uppercase">
              {node.name[lang]}
            </span>
            {currentPoints > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {lang === 'it' ? 'Attivo' : 'Active'}
              </span>
            )}
          </div>
        )}

        {/* Lock Banner */}
        {currentPoints === 0 && lockMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wide shadow-sm mb-3">
            <Lock size={15} className="shrink-0" />
            <span>{lockMessage}</span>
          </div>
        )}

        {/* Pathfinder auto-allocate helper */}
        {currentPoints === 0 && canAlloc.reason === 'missing_prerequisite' && (
          <button
            type="button"
            onClick={() => autoAllocatePath(node.id)}
            className="w-full mb-3 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            <Zap size={14} className="text-amber-500" />
            <span>{lang === 'it' ? 'Assegna requisiti mancanti' : 'Allocate prerequisites'}</span>
          </button>
        )}

        {/* Stepper / Action buttons */}
        <div className="flex items-center gap-2">
          {node.maxPoints > 1 ? (
            <>
              {/* Decrement */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDec.allowed}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title={canDec.reason || ''}
              >
                <Minus size={16} />
              </button>

              {/* Progress counter pill */}
              <div className="flex-1 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                {currentPoints} / {node.maxPoints}
              </div>

              {/* Increment */}
              <button
                type="button"
                onClick={handleAllocate}
                disabled={!canAlloc.allowed}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
              >
                <Plus size={16} />
              </button>

              {/* Max Out Button */}
              {!isMaxed && (
                <button
                  type="button"
                  onClick={handleMaxOut}
                  disabled={!canAlloc.allowed}
                  className="px-3 h-10 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  MAX
                </button>
              )}
            </>
          ) : (
            /* On/Off binary button (Milestones & 1-point nodes) */
            <div className="flex-1 flex gap-2">
              {currentPoints > 0 ? (
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={!canDec.allowed}
                  className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-30 transition-colors"
                >
                  <Minus size={15} />
                  <span>{lang === 'it' ? 'Rimuovi' : 'Remove'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAllocate}
                  disabled={!canAlloc.allowed}
                  className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <Plus size={15} />
                  <span>{lang === 'it' ? 'Sblocca Perk' : 'Unlock Perk'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Decrement Integrity Error */}
        {!canDec.allowed && canDec.reason === 'has_dependent_children' && currentPoints > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            <ShieldAlert size={13} className="shrink-0" />
            <span>
              {lang === 'it'
                ? 'Non puoi rimuovere punti: i nodi successivi dipendono da questo.'
                : 'Cannot remove: downstream nodes depend on this skill.'}
            </span>
          </div>
        )}

        {!canDec.allowed && canDec.reason === 'violates_gate_threshold' && currentPoints > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            <ShieldAlert size={13} className="shrink-0" />
            <span>
              {lang === 'it'
                ? 'Non puoi rimuovere punti: violeresti la soglia minima per la milestone attiva.'
                : 'Cannot remove: would violate minimum threshold for active milestone.'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="fixed bottom-20 md:bottom-6 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-200"
      aria-label="Skill Details"
    >
      {/* Top Header: Category Tag & Close */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: branchCfg.color }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {branchCfg.nameIt}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
      </div>

      {/* Node Title & Icon */}
      <div className="flex items-start gap-3.5 mb-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm overflow-hidden bg-zinc-950"
          style={{ borderColor: branchCfg.color }}
        >
          {primaryNode.icon && (
            <img
              src={`${import.meta.env.BASE_URL}${primaryNode.icon.replace(/^\//, '')}`}
              alt={primaryNode.name[lang]}
              className="w-10 h-10 object-contain drop-shadow"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-base tracking-tight leading-tight uppercase text-zinc-900 dark:text-zinc-100">
            {choiceNodes.length > 0
              ? lang === 'it'
                ? 'SCELTA MILESTONE'
                : 'MILESTONE CHOICE'
              : primaryNode.name[lang]}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {primaryNode.isMajor
              ? lang === 'it'
                ? 'Abilità Principale'
                : 'Major Skill'
              : lang === 'it'
                ? `Nodo Minore (Max ${primaryNode.maxPoints})`
                : `Minor Node (Max ${primaryNode.maxPoints})`}
          </p>
        </div>
      </div>

      {/* Description */}
      {choiceNodes.length === 0 ? (
        <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 mb-2">
          {primaryNode.description[lang]}
        </div>
      ) : (
        <div className="space-y-2 mb-2 text-xs">
          {choiceNodes.map((cn) => (
            <div
              key={cn.id}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60"
            >
              <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-xs">
                {cn.name[lang]}
              </div>
              <div className="text-zinc-600 dark:text-zinc-300 text-[11px] mt-1 leading-snug">
                {cn.description[lang]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls for single node or each choice */}
      {choiceNodes.length === 0
        ? renderNodeControls(primaryNode)
        : choiceNodes.map((cn) => renderNodeControls(cn))}
    </aside>
  );
};
