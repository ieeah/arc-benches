import React from 'react';
import type { SkillNode } from '@/types';
import { useTranslation } from '@/i18n';
import { Lock, Plus, Minus, Zap, ShieldAlert } from 'lucide-react';
import { BRANCH_CONFIGS } from './types';
import { SLOT_DEFINITIONS } from './skillLayout';
import { canAllocatePoint, canDecrementPoint, calculateSkillBudget } from '@/lib/skillTree';
import { useAppStore } from '@/store';
import { Drawer } from '@/components/Drawer';
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
  const extraSkillPoints = useAppStore((s) => s.extraSkillPoints);
  const sandboxMode = useAppStore((s) => s.sandboxMode);

  const allocateSkillPoint = useAppStore((s) => s.allocateSkillPoint);
  const decrementSkillPoint = useAppStore((s) => s.decrementSkillPoint);
  const autoAllocatePath = useAppStore((s) => s.autoAllocatePath);

  if (!selectedSlotId) return null;

  const budget = calculateSkillBudget(
    extraSkillPoints,
    sandboxMode,
    skillAllocations
  );

  const slotDef = SLOT_DEFINITIONS[selectedSlotId];

  let primaryNode: SkillNode | undefined;
  let choiceNodes: SkillNode[] = [];

  if (slotDef?.choiceNodeIds && slotDef.choiceNodeIds.length > 0) {
    choiceNodes = slotDef.choiceNodeIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is SkillNode => n !== undefined);
    primaryNode = choiceNodes[0];
  } else if (slotDef?.primaryNodeId) {
    primaryNode = nodeMap.get(slotDef.primaryNodeId);
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
      <div key={node.id} className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
            className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
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
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title={canDec.reason || ''}
              >
                <Minus size={18} />
              </button>

              {/* Progress counter pill */}
              <div className="flex-1 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-base bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                {currentPoints} / {node.maxPoints}
              </div>

              {/* Increment */}
              <button
                type="button"
                onClick={handleAllocate}
                disabled={!canAlloc.allowed}
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
              >
                <Plus size={18} />
              </button>

              {/* Max Out Button */}
              {!isMaxed && (
                <button
                  type="button"
                  onClick={handleMaxOut}
                  disabled={!canAlloc.allowed}
                  className="px-4 h-12 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
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
                  className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Minus size={16} />
                  <span>{lang === 'it' ? 'Rimuovi' : 'Remove'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAllocate}
                  disabled={!canAlloc.allowed}
                  className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs text-white bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{lang === 'it' ? 'Sblocca Perk' : 'Unlock Perk'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Decrement Integrity Error */}
        {!canDec.allowed && canDec.reason === 'has_dependent_children' && currentPoints > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-600 dark:text-amber-400">
            <ShieldAlert size={14} className="shrink-0" />
            <span>
              {lang === 'it'
                ? 'Non puoi rimuovere punti: i nodi successivi dipendono da questo.'
                : 'Cannot remove: downstream nodes depend on this skill.'}
            </span>
          </div>
        )}

        {!canDec.allowed && canDec.reason === 'violates_gate_threshold' && currentPoints > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-600 dark:text-amber-400">
            <ShieldAlert size={14} className="shrink-0" />
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
    <Drawer
      from="bottom"
      onClose={onClose}
      title={branchCfg.nameIt}
    >
      <div className="space-y-4">
        {/* Node Title & Icon */}
        <div className="flex items-start gap-3.5">
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
                ? slotDef?.tier === 7
                  ? lang === 'it'
                    ? 'SCELTA APEX MILESTONE'
                    : 'APEX MILESTONE CHOICE'
                  : lang === 'it'
                    ? 'SCELTA MILESTONE'
                    : 'MILESTONE CHOICE'
                : primaryNode.name[lang]}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {choiceNodes.length > 0
                ? slotDef?.minPointsSpent
                  ? lang === 'it'
                    ? `Richiede ${slotDef.minPointsSpent} punti nel ramo`
                    : `Requires ${slotDef.minPointsSpent} points in branch`
                  : ''
                : primaryNode.isMajor
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
          <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {primaryNode.description[lang]}
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {choiceNodes.map((cn) => (
              <div
                key={cn.id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60"
              >
                <div className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-xs">
                  {cn.name[lang]}
                </div>
                <div className="text-zinc-600 dark:text-zinc-300 text-xs mt-1 leading-snug">
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
      </div>
    </Drawer>
  );
};
