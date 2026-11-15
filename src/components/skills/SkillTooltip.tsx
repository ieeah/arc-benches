import React from 'react';
import type { SkillCategory, SkillNode } from '@/types';
import { BRANCH_CONFIGS } from './types';
import { Lock, Minus, Plus } from 'lucide-react';

export type SkillTooltipProps = {
  slotId: string;
  nodeData?: SkillNode;
  choiceNodes?: SkillNode[];
  allocatedPoints: number;
  maxPoints: number;
  category: SkillCategory;
  tier: number;
  isMilestone: boolean;
  isAvailable: boolean;
  isLocked: boolean;
  lockMessage?: string | null;
  clientX: number;
  clientY: number;
};

export const SkillTooltip: React.FC<SkillTooltipProps> = ({
  nodeData,
  choiceNodes,
  allocatedPoints,
  maxPoints,
  category,
  tier,
  isMilestone,
  isLocked,
  lockMessage,
  clientX,
  clientY,
}) => {
  const branchCfg = BRANCH_CONFIGS[category];
  const lang = 'it';

  // Calculate coordinates with boundary protection
  const tooltipWidth = 320;
  const estimatedHeight = isMilestone && choiceNodes && choiceNodes.length > 0 ? 320 : 240;

  // Position offset with rigid viewport bounding
  let posX = clientX + 16;
  let posY = clientY + 16;

  if (typeof window !== 'undefined') {
    if (posX + tooltipWidth > window.innerWidth - 12) {
      posX = clientX - tooltipWidth - 16;
    }
    // Hard clamp to prevent clipping on both left and right boundaries
    posX = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, posX));
    posY = Math.max(12, Math.min(window.innerHeight - estimatedHeight - 12, posY));
  }

  const activePerk = choiceNodes?.find((cn) => cn.id === nodeData?.id) || nodeData;
  const isMaxed = allocatedPoints >= maxPoints && maxPoints > 0;

  return (
    <div
      className="fixed pointer-events-none z-[70] w-80 bg-zinc-950/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-zinc-700/80 text-zinc-100 transition-opacity duration-150 animate-in fade-in zoom-in-95"
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
      }}
    >
      {/* Header: Category Badge & Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: branchCfg.color }}
          />
          <span
            className="text-[11px] font-extrabold uppercase tracking-wider"
            style={{ color: branchCfg.color }}
          >
            {branchCfg.nameIt} · T{tier}
          </span>
        </div>

        {/* Level / Status Pill */}
        {allocatedPoints > 0 ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            {isMaxed
              ? maxPoints === 1
                ? 'Attivo'
                : `Max (${allocatedPoints}/${maxPoints})`
              : `Livello ${allocatedPoints}/${maxPoints}`}
          </span>
        ) : isLocked ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/50 text-red-400 border border-red-800/40 flex items-center gap-1">
            <Lock size={10} />
            Bloccato
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Disponibile
          </span>
        )}
      </div>

      {/* Main Node Info */}
      <div className="flex items-start gap-3 mb-2.5">
        {activePerk?.icon && (
          <div
            className="w-11 h-11 rounded-xl bg-zinc-900 border-2 shrink-0 flex items-center justify-center overflow-hidden shadow-sm"
            style={{ borderColor: branchCfg.color }}
          >
            <img
              src={`${import.meta.env.BASE_URL}${activePerk.icon.replace(/^\//, '')}`}
              alt={activePerk.name[lang]}
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm uppercase tracking-tight text-white leading-tight">
            {isMilestone && choiceNodes && choiceNodes.length > 0 && allocatedPoints === 0
              ? 'Scelta Milestone'
              : activePerk?.name[lang] || 'Abilità'}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {isMilestone
              ? `Milestone (${tier === 4 ? '10 SP' : tier === 7 ? '30/40 SP' : ''})`
              : activePerk?.isMajor
                ? 'Abilità Principale'
                : `Nodo Minore (Max ${maxPoints} pt)`}
          </p>
        </div>
      </div>

      {/* Description */}
      {isMilestone && choiceNodes && choiceNodes.length > 0 ? (
        <div className="space-y-1.5 mb-2.5">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Opzioni disponibili:</p>
          {choiceNodes.map((cn) => {
            const isChosen = nodeData?.id === cn.id && allocatedPoints > 0;
            return (
              <div
                key={cn.id}
                className={`p-2 rounded-xl text-xs border ${
                  isChosen
                    ? 'bg-zinc-800/90 border-amber-500/50 text-amber-200'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between text-[11px]">
                  <span>{cn.name[lang]}</span>
                  {isChosen && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      ATTIVO
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  {cn.description[lang]}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-zinc-300 leading-relaxed mb-2.5">
          {activePerk?.description[lang]}
        </div>
      )}

      {/* Lock Requirement Banner */}
      {isLocked && lockMessage && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-red-950/70 border border-red-800/50 text-red-300 text-[11px] font-semibold mb-2.5">
          <Lock size={13} className="shrink-0 text-red-400" />
          <span>{lockMessage}</span>
        </div>
      )}

      {/* Action shortcuts hint footer */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-bold text-zinc-400">
        <span className="flex items-center gap-1 text-zinc-300">
          <Plus size={11} className="text-emerald-400" />
          <span>Click Sx: +1 pt</span>
        </span>
        <span className="flex items-center gap-1 text-zinc-300">
          <Minus size={11} className="text-red-400" />
          <span>Click Dx: -1 pt</span>
        </span>
      </div>
    </div>
  );
};
