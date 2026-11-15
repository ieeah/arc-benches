import React from 'react';
import { createPortal } from 'react-dom';
import type { SkillNode } from '@/types';
import skillsData from '@/data/skills.json';
import { BRANCH_CONFIGS } from './types';
import { SLOT_DEFINITIONS } from './skillLayout';
import { canAllocatePoint, canDecrementPoint, calculateSkillBudget } from '@/lib/skillTree';
import { useAppStore } from '@/store';
import { Lock, X, Check, Trash2, Plus } from 'lucide-react';

const allNodes = skillsData as SkillNode[];
const nodeMap = new Map<string, SkillNode>(allNodes.map((n) => [n.id, n]));

type MilestoneModalProps = {
  slotId: string | null;
  onClose: () => void;
};

export const MilestoneModal: React.FC<MilestoneModalProps> = ({ slotId, onClose }) => {
  const skillAllocations = useAppStore((s) => s.skillAllocations);
  const extraSkillPoints = useAppStore((s) => s.extraSkillPoints);
  const sandboxMode = useAppStore((s) => s.sandboxMode);
  const allocateSkillPoint = useAppStore((s) => s.allocateSkillPoint);
  const decrementSkillPoint = useAppStore((s) => s.decrementSkillPoint);

  if (!slotId) return null;

  const slotDef = SLOT_DEFINITIONS[slotId];
  if (!slotDef || !slotDef.isMilestone) return null;

  const budget = calculateSkillBudget(
    extraSkillPoints,
    sandboxMode,
    skillAllocations
  );

  const branchCfg = BRANCH_CONFIGS[slotDef.category];
  const lang = 'it';

  const choiceNodes = (slotDef.choiceNodeIds || [])
    .map((id) => nodeMap.get(id))
    .filter((n): n is SkillNode => n !== undefined);

  if (choiceNodes.length === 0) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ backgroundColor: branchCfg.color }}
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {branchCfg.nameIt} · MILESTONE {slotDef.minPointsSpent ? `${slotDef.minPointsSpent} SP` : ''}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white mt-0.5">
                {slotDef.tier === 7 ? 'Scegli Abilità Apex' : 'Scegli Abilità Milestone'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        {/* Milestone Cards Grid (Matching Game Screenshot 2) */}
        <div
          className={`grid gap-4 ${
            choiceNodes.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {choiceNodes.map((node) => {
            const currentPoints = skillAllocations[node.id] || 0;
            const isAllocated = currentPoints > 0;
            const canAlloc = canAllocatePoint(node.id, skillAllocations, budget, nodeMap);
            const canDec = canDecrementPoint(node.id, skillAllocations, nodeMap);

            // In-game style lock requirement messages
            let lockMsg: string | null = null;
            if (!canAlloc.allowed) {
              if (canAlloc.reason === 'gate_locked_10') {
                lockMsg = `Richiede 10 SP in ${branchCfg.nameIt}`;
              } else if (canAlloc.reason === 'gate_locked_30') {
                lockMsg = `Richiede 30 SP in ${branchCfg.nameIt}`;
              } else if (canAlloc.reason === 'gate_locked_40') {
                lockMsg = `Richiede 40 SP in ${branchCfg.nameIt}`;
              } else if (canAlloc.reason === 'insufficient_points') {
                lockMsg = 'Punti SP esauriti';
              } else if (canAlloc.reason === 'missing_prerequisite') {
                lockMsg = 'Requisiti mancanti';
              }
            }

            const handleUnlock = () => {
              allocateSkillPoint(node.id);
            };

            const handleRemove = () => {
              decrementSkillPoint(node.id);
            };

            return (
              <div
                key={node.id}
                className={`flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                  isAllocated
                    ? 'bg-zinc-900/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Card Top: Icon, Title, Description */}
                <div className="flex flex-col items-center text-center gap-3">
                  {/* Perk Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 overflow-hidden bg-zinc-950 shadow-inner ${
                      isAllocated
                        ? 'border-emerald-400'
                        : 'border-zinc-700'
                    }`}
                  >
                    {node.icon ? (
                      <img
                        src={`${import.meta.env.BASE_URL}${node.icon.replace(/^\//, '')}`}
                        alt={node.name[lang]}
                        className="w-11 h-11 object-contain drop-shadow"
                      />
                    ) : (
                      <span className="text-xl font-bold font-mono">?</span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="font-extrabold text-base uppercase tracking-tight text-white leading-tight">
                      {node.name[lang]}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 uppercase tracking-wider font-semibold">
                      {node.isMajor ? 'Abilità Principale' : 'Milestone Perk'}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed min-h-[4rem] text-left">
                    {node.description[lang]}
                  </p>
                </div>

                {/* Card Bottom: Divider & Action Button */}
                <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col gap-2">
                  {isAllocated ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        <Check size={16} />
                        <span>Abilità Applicata</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={!canDec.allowed}
                        className="py-2.5 px-3 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/50 border border-red-800/40 text-xs font-bold transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Rimuovi punto perk"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUnlock}
                      disabled={!canAlloc.allowed}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm text-zinc-950 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800 disabled:pointer-events-none"
                    >
                      {lockMsg ? (
                        <>
                          <Lock size={14} />
                          <span>{lockMsg}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={15} />
                          <span>Sblocca Perk</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
