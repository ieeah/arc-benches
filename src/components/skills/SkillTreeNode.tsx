import React from 'react';
import type { SkillCategory, SkillNode } from '@/types';
import { Lock } from 'lucide-react';
import { BRANCH_CONFIGS } from './types';

type SkillTreeNodeProps = {
  slotId: string;
  x: number;
  y: number;
  category: SkillCategory;
  tier: number;
  isMilestone: boolean;
  nodeData?: SkillNode;
  choiceNodes?: SkillNode[]; // For mid milestone with 4l/4r
  allocatedPoints: number;
  maxPoints: number;
  isAvailable: boolean;
  isLocked: boolean;
  isSelected: boolean;
  onClick: () => void;
};

export const SkillTreeNode: React.FC<SkillTreeNodeProps> = ({
  slotId,
  x,
  y,
  category,
  tier,
  isMilestone,
  nodeData,
  choiceNodes,
  allocatedPoints,
  maxPoints,
  isAvailable,
  isLocked,
  isSelected,
  onClick,
}) => {
  const branchCfg = BRANCH_CONFIGS[category];
  const isRoot = tier === 1;
  const isMaxed = allocatedPoints >= maxPoints && maxPoints > 0;
  const hasPoints = allocatedPoints > 0;

  // Icon url
  const activeIcon = nodeData?.icon || choiceNodes?.find((c) => c.id === slotId)?.icon;

  if (isMilestone) {
    // Diamond representation (rotated square)
    const diamondSize = 36;
    const half = diamondSize / 2;

    let fillColor = '#18181b'; // dark zinc
    let strokeColor = '#3f3f46'; // zinc-700
    let strokeWidth = 2;

    if (hasPoints) {
      fillColor = branchCfg.color;
      strokeColor = '#ffffff';
      strokeWidth = 2.5;
    } else if (isAvailable) {
      fillColor = '#27272a';
      strokeColor = branchCfg.color;
      strokeWidth = 2;
    }

    return (
      <g
        className="cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 select-none"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Milestone Tier ${tier}`}
      >
        {/* Selection ring */}
        {isSelected && (
          <rect
            x={x - half - 6}
            y={y - half - 6}
            width={diamondSize + 12}
            height={diamondSize + 12}
            rx={8}
            transform={`rotate(45 ${x} ${y})`}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeDasharray="4 3"
            className="animate-spin-slow origin-center"
          />
        )}

        {/* Outer Glow */}
        {hasPoints && (
          <rect
            x={x - half - 4}
            y={y - half - 4}
            width={diamondSize + 8}
            height={diamondSize + 8}
            rx={6}
            transform={`rotate(45 ${x} ${y})`}
            fill="none"
            stroke={branchCfg.color}
            strokeWidth={4}
            opacity={0.4}
            filter="blur(3px)"
          />
        )}

        {/* Diamond Base */}
        <rect
          x={x - half}
          y={y - half}
          width={diamondSize}
          height={diamondSize}
          rx={5}
          transform={`rotate(45 ${x} ${y})`}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />

        {/* Icon / Content */}
        {hasPoints && activeIcon ? (
          <image
            href={`${import.meta.env.BASE_URL}${activeIcon.replace(/^\//, '')}`}
            x={x - 13}
            y={y - 13}
            width={26}
            height={26}
            className="pointer-events-none drop-shadow"
          />
        ) : isLocked ? (
          <g transform={`translate(${x - 8}, ${y - 8})`}>
            <Lock size={16} className="text-zinc-500" strokeWidth={2.5} />
          </g>
        ) : (
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fill={branchCfg.color}
            fontSize="18"
            fontWeight="bold"
            className="pointer-events-none select-none font-mono"
          >
            ?
          </text>
        )}

        {/* Milestone Requirement Pill underneath if locked */}
        {isLocked && (
          <g transform={`translate(${x}, ${y + 28})`}>
            <rect
              x={-24}
              y={-8}
              width={48}
              height={16}
              rx={8}
              fill="#09090b"
              stroke="#27272a"
              strokeWidth={1}
            />
            <text
              x={0}
              y={3}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontWeight="bold"
              className="font-mono tracking-tight"
            >
              {tier === 4 ? '10 SP' : slotId.endsWith('7l') ? '30 SP' : '40 SP'}
            </text>
          </g>
        )}
      </g>
    );
  }

  // Regular Circle Node
  const radius = isRoot ? 28 : 20;
  const iconSize = isRoot ? 34 : 26;

  let strokeColor = '#3f3f46';
  let strokeWidth = 2;
  let fillColor = '#18181b';

  if (isMaxed) {
    strokeColor = branchCfg.color;
    strokeWidth = 3;
    fillColor = '#1e293b';
  } else if (hasPoints) {
    strokeColor = branchCfg.color;
    strokeWidth = 2.5;
    fillColor = '#18181b';
  } else if (isAvailable) {
    strokeColor = branchCfg.color;
    strokeWidth = 1.5;
  }

  return (
    <g
      className="cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-95 select-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={nodeData?.name.it || slotId}
    >
      {/* Selection Ring */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={radius + 6}
          fill="none"
          stroke="#ffffff"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}

      {/* Radiant Glow if allocated */}
      {hasPoints && (
        <circle
          cx={x}
          cy={y}
          r={radius + 4}
          fill="none"
          stroke={branchCfg.color}
          strokeWidth={4}
          opacity={0.4}
          filter="blur(3px)"
        />
      )}

      {/* Main Circle */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      {/* Node Icon */}
      {activeIcon ? (
        <image
          href={`${import.meta.env.BASE_URL}${activeIcon.replace(/^\//, '')}`}
          x={x - iconSize / 2}
          y={y - iconSize / 2}
          width={iconSize}
          height={iconSize}
          opacity={isLocked ? 0.35 : 1}
          className="pointer-events-none drop-shadow"
        />
      ) : isLocked ? (
        <g transform={`translate(${x - 7}, ${y - 7})`}>
          <Lock size={14} className="text-zinc-600" />
        </g>
      ) : null}

      {/* Points Counter Badge underneath */}
      {maxPoints > 1 && (
        <g transform={`translate(${x}, ${y + radius + 11})`}>
          <rect
            x={-18}
            y={-7}
            width={36}
            height={14}
            rx={7}
            fill={hasPoints ? '#09090b' : '#18181b'}
            stroke={hasPoints ? branchCfg.color : '#3f3f46'}
            strokeWidth={1}
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fill={isMaxed ? branchCfg.color : hasPoints ? '#ffffff' : '#71717a'}
            fontSize="9"
            fontWeight="bold"
            className="font-mono"
          >
            {allocatedPoints}/{maxPoints}
          </text>
        </g>
      )}

      {/* On/Off Checkmark Indicator for 1-point binary nodes */}
      {maxPoints === 1 && hasPoints && !isMilestone && (
        <g transform={`translate(${x + radius - 6}, ${y - radius + 6})`}>
          <circle cx={0} cy={0} r={6} fill={branchCfg.color} />
          <path
            d="M -3 0 L -1 2 L 3 -2"
            fill="none"
            stroke="#000000"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};
