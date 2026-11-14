import React, { useState, useRef, useCallback } from 'react';
import type { SkillCategory, SkillNode } from '@/types';
import skillsData from '@/data/skills.json';
import { useAppStore } from '@/store';
import { BRANCH_CONFIGS } from './types';
import {
  computeAllNodePositions,
  computeBranchConnections,
  type SkillConnection,
} from './skillLayout';
import { SkillTreeNode } from './SkillTreeNode';
import { canAllocatePoint, calculateSkillBudget } from '@/lib/skillTree';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const allNodes = skillsData as SkillNode[];
const nodeMap = new Map<string, SkillNode>(allNodes.map((n) => [n.id, n]));

type SkillTreeCanvasProps = {
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
};

export const SkillTreeCanvas: React.FC<SkillTreeCanvasProps> = ({
  selectedSlotId,
  onSelectSlot,
}) => {
  const skillAllocations = useAppStore((s) => s.skillAllocations);
  const raiderLevel = useAppStore((s) => s.raiderLevel);
  const earnedPermanentSkillPoints = useAppStore((s) => s.earnedPermanentSkillPoints);
  const useExpeditionBonus = useAppStore((s) => s.useExpeditionBonus);
  const sandboxMode = useAppStore((s) => s.sandboxMode);

  const budget = calculateSkillBudget(
    raiderLevel,
    earnedPermanentSkillPoints,
    useExpeditionBonus,
    sandboxMode,
    skillAllocations
  );

  // Layout calculations
  const nodePositions = computeAllNodePositions();
  const condConnections = computeBranchConnections(BRANCH_CONFIGS.CONDITIONING);
  const mobConnections = computeBranchConnections(BRANCH_CONFIGS.MOBILITY);
  const survConnections = computeBranchConnections(BRANCH_CONFIGS.SURVIVAL);
  const allConnections: SkillConnection[] = [
    ...condConnections,
    ...mobConnections,
    ...survConnections,
  ];

  // Branch points
  const getBranchPoints = (cat: SkillCategory) => {
    return Object.entries(skillAllocations).reduce((acc, [id, pts]) => {
      const node = nodeMap.get(id);
      return node && node.category === cat ? acc + pts : acc;
    }, 0);
  };

  const condPoints = getBranchPoints('CONDITIONING');
  const mobPoints = getBranchPoints('MOBILITY');
  const survPoints = getBranchPoints('SURVIVAL');

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.0, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, z - 0.2));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Quick Branch Focus
  const focusBranch = (branch: 'ALL' | SkillCategory) => {
    if (branch === 'ALL') {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else if (branch === 'CONDITIONING') {
      setZoom(1.35);
      setPan({ x: 300, y: 50 });
    } else if (branch === 'MOBILITY') {
      setZoom(1.35);
      setPan({ x: 0, y: 100 });
    } else if (branch === 'SURVIVAL') {
      setZoom(1.35);
      setPan({ x: -300, y: 50 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[760px] md:h-[820px] bg-[#07080a] select-none overflow-hidden rounded-3xl border border-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Floating Canvas Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* Branch Quick Focus Pills */}
        <div className="flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-md">
          <button
            type="button"
            onClick={() => focusBranch('ALL')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Tridente
          </button>
          <button
            type="button"
            onClick={() => focusBranch('CONDITIONING')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-emerald-400 hover:bg-emerald-950/40 transition-colors"
          >
            Condizionamento
          </button>
          <button
            type="button"
            onClick={() => focusBranch('MOBILITY')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-yellow-400 hover:bg-yellow-950/40 transition-colors"
          >
            Mobilità
          </button>
          <button
            type="button"
            onClick={() => focusBranch('SURVIVAL')}
            className="px-2.5 py-1 text-xs font-bold rounded-lg text-red-400 hover:bg-red-950/40 transition-colors"
          >
            Sopravvivenza
          </button>
        </div>

        {/* Zoom Stepper */}
        <div className="flex items-center gap-0.5 bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Ingrandisci"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Riduci"
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Ripristina vista"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Interactive SVG */}
      <svg
        viewBox="0 0 1400 920"
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          {/* Subtle Ambient Radial Gradients behind each branch */}
          <radialGradient id="glow-cond" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e599" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00e599" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-mob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffcc00" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffcc00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-surv" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff3344" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ff3344" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow Circles */}
        <circle cx="340" cy="520" r="320" fill="url(#glow-cond)" />
        <circle cx="700" cy="450" r="320" fill="url(#glow-mob)" />
        <circle cx="1060" cy="520" r="320" fill="url(#glow-surv)" />

        {/* Root Trunk Conduits (rising from base) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Base bottom trunk */}
          <path d="M 692 920 L 692 820" stroke="#00e599" strokeWidth="4" />
          <path d="M 700 920 L 700 815" stroke="#ffcc00" strokeWidth="4" />
          <path d="M 708 920 L 708 820" stroke="#ff3344" strokeWidth="4" />

          {/* Fork into roots */}
          <path
            d="M 692 820 Q 670 800 620 760"
            fill="none"
            stroke="#00e599"
            strokeWidth="4"
          />
          <path
            d="M 700 815 L 700 760"
            fill="none"
            stroke="#ffcc00"
            strokeWidth="4"
          />
          <path
            d="M 708 820 Q 730 800 780 760"
            fill="none"
            stroke="#ff3344"
            strokeWidth="4"
          />
        </g>

        {/* Branch Connecting Circuits */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {allConnections.map((conn) => {
            const branchCfg = BRANCH_CONFIGS[conn.category];
            // Check if destination node is active
            const isTargetActive = conn.toNodeId.endsWith('_4')
              ? (skillAllocations[`${conn.toNodeId.slice(0, 4)}l`] || 0) > 0 ||
                (skillAllocations[`${conn.toNodeId.slice(0, 4)}r`] || 0) > 0
              : (skillAllocations[conn.toNodeId] || 0) > 0;

            return (
              <path
                key={conn.id}
                d={conn.path}
                stroke={isTargetActive ? branchCfg.color : '#27272a'}
                strokeWidth={isTargetActive ? 4 : 2.5}
                opacity={isTargetActive ? 1 : 0.6}
                filter={isTargetActive ? 'drop-shadow(0 0 3px currentColor)' : undefined}
                className="transition-colors duration-200"
              />
            );
          })}
        </g>

        {/* Branch Names & Points Indicators */}
        {/* Conditioning */}
        <g transform="translate(480, 800)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#00e599"
            fontSize="16"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase"
          >
            CONDIZIONAMENTO
          </text>
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill="#00e599"
            fontSize="24"
            fontWeight="900"
            className="font-mono tracking-tight"
          >
            {condPoints}
          </text>
        </g>

        {/* Mobility */}
        <g transform="translate(700, 690)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#ffcc00"
            fontSize="16"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase"
          >
            MOBILITÀ
          </text>
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill="#ffcc00"
            fontSize="24"
            fontWeight="900"
            className="font-mono tracking-tight"
          >
            {mobPoints}
          </text>
        </g>

        {/* Survival */}
        <g transform="translate(920, 800)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#ff3344"
            fontSize="16"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase"
          >
            SOPRAVVIVENZA
          </text>
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill="#ff3344"
            fontSize="24"
            fontWeight="900"
            className="font-mono tracking-tight"
          >
            {survPoints}
          </text>
        </g>

        {/* Interactive Skill Nodes */}
        {Object.entries(nodePositions).map(([slotId, pos]) => {
          let nodeData: SkillNode | undefined;
          let choiceNodes: SkillNode[] = [];
          let allocatedPoints = 0;
          let maxPoints = 5;
          let isAvailable = false;
          let isLocked = false;

          if (pos.isMilestone && slotId.endsWith('_4')) {
            // Mid milestone slot housing 4l and 4r
            const prefix = slotId.slice(0, 4);
            const lNode = nodeMap.get(`${prefix}l`);
            const rNode = nodeMap.get(`${prefix}r`);
            choiceNodes = [lNode, rNode].filter((n): n is SkillNode => n !== undefined);
            nodeData = choiceNodes[0];
            maxPoints = 1;

            const lPts = skillAllocations[`${prefix}l`] || 0;
            const rPts = skillAllocations[`${prefix}r`] || 0;
            allocatedPoints = Math.max(lPts, rPts);

            if (allocatedPoints > 0) {
              isAvailable = true;
              isLocked = false;
            } else {
              const checkL = lNode
                ? canAllocatePoint(lNode.id, skillAllocations, budget, nodeMap)
                : { allowed: false };
              const checkR = rNode
                ? canAllocatePoint(rNode.id, skillAllocations, budget, nodeMap)
                : { allowed: false };
              isAvailable = checkL.allowed || checkR.allowed;
              isLocked = !isAvailable;
            }
          } else {
            nodeData = nodeMap.get(slotId);
            if (nodeData) {
              maxPoints = nodeData.maxPoints;
              allocatedPoints = skillAllocations[slotId] || 0;
              const check = canAllocatePoint(slotId, skillAllocations, budget, nodeMap);
              isAvailable = check.allowed;
              isLocked = !check.allowed && allocatedPoints === 0;
            }
          }

          const isSelected = selectedSlotId === slotId;

          return (
            <SkillTreeNode
              key={slotId}
              slotId={slotId}
              x={pos.x}
              y={pos.y}
              category={pos.category}
              tier={pos.tier}
              isMilestone={pos.isMilestone}
              nodeData={nodeData}
              choiceNodes={choiceNodes}
              allocatedPoints={allocatedPoints}
              maxPoints={maxPoints}
              isAvailable={isAvailable}
              isLocked={isLocked}
              isSelected={isSelected}
              onClick={() => onSelectSlot(slotId)}
            />
          );
        })}
      </svg>
    </div>
  );
};
