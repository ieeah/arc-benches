import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { SkillCategory, SkillNode } from '@/types';
import skillsData from '@/data/skills.json';
import { useAppStore } from '@/store';
import { BRANCH_CONFIGS } from './types';
import {
  computeAllNodePositions,
  computeBranchConnections,
  SLOT_DEFINITIONS,
} from './skillLayout';
import { SkillTreeNode } from './SkillTreeNode';
import { SkillTooltip, type SkillTooltipProps } from './SkillTooltip';
import { canAllocatePoint, calculateSkillBudget, calculateBranchSpent } from '@/lib/skillTree';
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
  const extraSkillPoints = useAppStore((s) => s.extraSkillPoints);
  const sandboxMode = useAppStore((s) => s.sandboxMode);
  const allocateSkillPoint = useAppStore((s) => s.allocateSkillPoint);
  const decrementSkillPoint = useAppStore((s) => s.decrementSkillPoint);

  const [hoveredTooltip, setHoveredTooltip] = useState<SkillTooltipProps | null>(null);

  const budget = calculateSkillBudget(
    extraSkillPoints,
    sandboxMode,
    skillAllocations
  );

  // Layout calculations (cached with useMemo to prevent recalculating on drag)
  const nodePositions = useMemo(() => computeAllNodePositions(), []);
  const allConnections = useMemo(() => [
    ...computeBranchConnections(BRANCH_CONFIGS.CONDITIONING),
    ...computeBranchConnections(BRANCH_CONFIGS.MOBILITY),
    ...computeBranchConnections(BRANCH_CONFIGS.SURVIVAL),
  ], []);

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

  // Pan & Zoom state & limits
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4.5;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [zoom, setZoom] = useState(isMobile ? 1.05 : 1);
  const [pan, setPan] = useState({ x: 0, y: isMobile ? -20 : 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeBranchTab, setActiveBranchTab] = useState<'ALL' | SkillCategory>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasMovedRef = useRef(false);

  // Synchronize mutable refs for zero-latency direct DOM updates
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  panRef.current = pan;
  zoomRef.current = zoom;

  // Direct 2D transform update on the SVG node (crisp vector rendering without 3D texture compression blur)
  const applyTransformDirect = (x: number, y: number, z: number) => {
    if (svgRef.current) {
      svgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
    }
  };

  // Sync direct transform when React state changes (e.g. from buttons)
  useEffect(() => {
    applyTransformDirect(pan.x, pan.y, zoom);
  }, [pan, zoom]);

  // Mouse pan tracking
  const mouseDragStart = useRef({ x: 0, y: 0 });
  const mousePanStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsInteracting(true);
    hasMovedRef.current = false;
    mouseDragStart.current = { x: e.clientX, y: e.clientY };
    mousePanStart.current = { x: panRef.current.x, y: panRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    const dx = e.clientX - mouseDragStart.current.x;
    const dy = e.clientY - mouseDragStart.current.y;
    if (Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }
    const currentX = mousePanStart.current.x + dx;
    const currentY = mousePanStart.current.y + dy;
    applyTransformDirect(currentX, currentY, zoomRef.current);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    setIsInteracting(false);
    const dx = e.clientX - mouseDragStart.current.x;
    const dy = e.clientY - mouseDragStart.current.y;
    setPan({
      x: mousePanStart.current.x + dx,
      y: mousePanStart.current.y + dy,
    });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((zoomRef.current + delta).toFixed(2))));
    setZoom(nextZoom);
  };

  // Touch tracking for mobile 1-finger pan and 2-finger pinch
  const touchStateRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startDistance: number;
    startZoom: number;
    currentPanX: number;
    currentPanY: number;
    currentZoom: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    startDistance: 0,
    startZoom: 1,
    currentPanX: 0,
    currentPanY: 0,
    currentZoom: 1,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    hasMovedRef.current = false;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        startDistance: 0,
        startZoom: zoomRef.current,
        currentPanX: panRef.current.x,
        currentPanY: panRef.current.y,
        currentZoom: zoomRef.current,
      };
      setIsInteracting(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStateRef.current = {
        mode: 'pinch',
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
        startDistance: dist,
        startZoom: zoomRef.current,
        currentPanX: panRef.current.x,
        currentPanY: panRef.current.y,
        currentZoom: zoomRef.current,
      };
      setIsInteracting(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const data = touchStateRef.current;
    if (data.mode === 'none') return;

    if (data.mode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - data.startX;
      const dy = t.clientY - data.startY;
      if (Math.hypot(dx, dy) > 5) {
        hasMovedRef.current = true;
      }
      data.currentPanX = data.startPanX + dx;
      data.currentPanY = data.startPanY + dy;
      applyTransformDirect(data.currentPanX, data.currentPanY, data.startZoom);
    } else if (data.mode === 'pinch' && e.touches.length === 2) {
      hasMovedRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (data.startDistance > 0) {
        const factor = currentDist / data.startDistance;
        data.currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((data.startZoom * factor).toFixed(2))));
        applyTransformDirect(data.currentPanX, data.currentPanY, data.currentZoom);
      }
    }
  };

  const handleTouchEnd = () => {
    const data = touchStateRef.current;
    if (data.mode !== 'none') {
      data.mode = 'none';
      setIsInteracting(false);
      setPan({ x: data.currentPanX, y: data.currentPanY });
      setZoom(data.currentZoom);
    }
  };

  // Mathematically centers any SVG coordinate precisely in the middle of the user's viewport
  const focusOnSvgPoint = (svgX: number, svgY: number, targetZoom: number, tab: 'ALL' | SkillCategory) => {
    setActiveBranchTab(tab);
    const container = containerRef.current;
    const w = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 390);
    const h = container ? container.clientHeight : 760;
    const sBase = Math.min(w / 1400, h / 920);

    const deltaX = svgX - 700;
    const deltaY = svgY - 460;

    // Subtle upward vertical compensation on mobile for bottom floating navigation bar
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    const bottomNavCompensation = isMobileDevice ? -25 : 0;

    const targetPanX = Math.round(-deltaX * sBase * targetZoom);
    const targetPanY = Math.round(-deltaY * sBase * targetZoom + bottomNavCompensation);

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Number((z + 0.3).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Number((z - 0.3).toFixed(2))));
  const handleResetZoom = () => {
    focusBranch('ALL');
  };

  // Quick Branch Focus (centers exact branch centroid on any device width)
  const focusBranch = (branch: 'ALL' | SkillCategory) => {
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
    if (branch === 'ALL') {
      focusOnSvgPoint(700, 500, isMobileDevice ? 1.05 : 1.0, 'ALL');
    } else if (branch === 'CONDITIONING') {
      focusOnSvgPoint(330, 560, isMobileDevice ? 1.9 : 1.45, 'CONDITIONING');
    } else if (branch === 'MOBILITY') {
      focusOnSvgPoint(700, 420, isMobileDevice ? 1.9 : 1.45, 'MOBILITY');
    } else if (branch === 'SURVIVAL') {
      focusOnSvgPoint(1070, 560, isMobileDevice ? 1.9 : 1.45, 'SURVIVAL');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[760px] md:h-[820px] bg-[#07080a] select-none overflow-hidden rounded-3xl border border-zinc-900 shadow-2xl cursor-grab active:cursor-grabbing touch-none"
      style={{ touchAction: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Floating Canvas Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* Branch Quick Focus Pills */}
        <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-md">
          <button
            type="button"
            onClick={() => focusBranch('ALL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeBranchTab === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Tridente
          </button>
          <button
            type="button"
            onClick={() => focusBranch('CONDITIONING')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeBranchTab === 'CONDITIONING'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-emerald-400 hover:bg-emerald-950/40'
            }`}
          >
            Condizionamento
          </button>
          <button
            type="button"
            onClick={() => focusBranch('MOBILITY')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeBranchTab === 'MOBILITY'
                ? 'bg-yellow-950/70 text-yellow-300 border border-yellow-500/40 shadow-sm'
                : 'text-yellow-400 hover:bg-yellow-950/40'
            }`}
          >
            Mobilità
          </button>
          <button
            type="button"
            onClick={() => focusBranch('SURVIVAL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              activeBranchTab === 'SURVIVAL'
                ? 'bg-red-950/70 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-red-400 hover:bg-red-950/40'
            }`}
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

      {/* Main Interactive SVG (Ultra-sharp geometric vector rendering) */}
      <svg
        ref={svgRef}
        viewBox="0 0 1400 920"
        className="w-full h-full"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        style={{
          transformOrigin: '50% 50%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isInteracting ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
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
        <circle cx="380" cy="560" r="320" fill="url(#glow-cond)" />
        <circle cx="700" cy="420" r="320" fill="url(#glow-mob)" />
        <circle cx="1020" cy="560" r="320" fill="url(#glow-surv)" />

        {/* Root Trunk Conduits (rising from base) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Base bottom trunk and graceful curves to each root */}
          <path
            d="M 692 920 L 692 840 C 692 795, 590 775, 520 760"
            fill="none"
            stroke="#00e599"
            strokeWidth="4"
          />
          <path
            d="M 700 920 L 700 690"
            fill="none"
            stroke="#ffcc00"
            strokeWidth="4"
          />
          <path
            d="M 708 920 L 708 840 C 708 795, 810 775, 880 760"
            fill="none"
            stroke="#ff3344"
            strokeWidth="4"
          />
        </g>

        {/* Branch Connecting Circuits */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {allConnections.map((conn) => {
            const branchCfg = BRANCH_CONFIGS[conn.category];
            const slotDef = SLOT_DEFINITIONS[conn.toNodeId];
            const isTargetActive = (() => {
              if (!slotDef) return false;
              if (slotDef.choiceNodeIds) {
                return slotDef.choiceNodeIds.some((id) => (skillAllocations[id] || 0) > 0);
              }
              return slotDef.primaryNodeId
                ? (skillAllocations[slotDef.primaryNodeId] || 0) > 0
                : false;
            })();

            return (
              <path
                key={conn.id}
                d={conn.path}
                stroke={isTargetActive ? branchCfg.color : '#3f3f46'}
                strokeWidth={isTargetActive ? 4 : 2.5}
                opacity={isTargetActive ? 1 : 0.85}
                className="transition-colors duration-200"
              />
            );
          })}
        </g>

        {/* Branch Names & Points Indicators (Spacious and cleanly positioned, matching game) */}
        {/* Conditioning (positioned below green root node) */}
        <g transform="translate(520, 830)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#00e599"
            fontSize="15"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase select-none pointer-events-none"
          >
            CONDIZIONAMENTO
          </text>
          <text
            x="0"
            y="24"
            textAnchor="middle"
            fill="#00e599"
            fontSize="22"
            fontWeight="900"
            className="font-mono tracking-tight select-none pointer-events-none"
          >
            {condPoints}
          </text>
        </g>

        {/* Mobility (positioned in generous center loop between lateral tracks) */}
        <g transform="translate(700, 560)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#ffcc00"
            fontSize="15"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase select-none pointer-events-none"
          >
            MOBILITÀ
          </text>
          <text
            x="0"
            y="24"
            textAnchor="middle"
            fill="#ffcc00"
            fontSize="22"
            fontWeight="900"
            className="font-mono tracking-tight select-none pointer-events-none"
          >
            {mobPoints}
          </text>
        </g>

        {/* Survival (positioned below red root node) */}
        <g transform="translate(880, 830)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#ff3344"
            fontSize="15"
            fontWeight="900"
            letterSpacing="0.08em"
            className="tracking-wider uppercase select-none pointer-events-none"
          >
            SOPRAVVIVENZA
          </text>
          <text
            x="0"
            y="24"
            textAnchor="middle"
            fill="#ff3344"
            fontSize="22"
            fontWeight="900"
            className="font-mono tracking-tight select-none pointer-events-none"
          >
            {survPoints}
          </text>
        </g>

        {/* Interactive Skill Nodes */}
        {Object.entries(nodePositions).map(([slotId, pos]) => {
          const slotDef = SLOT_DEFINITIONS[slotId];
          let nodeData: SkillNode | undefined;
          let choiceNodes: SkillNode[] = [];
          let allocatedPoints = 0;
          let maxPoints = 5;
          let isAvailable = false;
          let isLocked = false;

          if (slotDef?.choiceNodeIds && slotDef.choiceNodeIds.length > 0) {
            choiceNodes = slotDef.choiceNodeIds
              .map((id) => nodeMap.get(id))
              .filter((n): n is SkillNode => n !== undefined);
            nodeData = choiceNodes[0];
            maxPoints = 1;

            if (slotDef.tier === 4) {
              // Mid milestone: checks if any choice node has points
              allocatedPoints = Math.max(...choiceNodes.map((cn) => skillAllocations[cn.id] || 0));
              if (allocatedPoints > 0) {
                isAvailable = true;
                isLocked = false;
              } else {
                const canAny = choiceNodes.some(
                  (cn) => canAllocatePoint(cn.id, skillAllocations, budget, nodeMap).allowed
                );
                isAvailable = canAny;
                isLocked = !isAvailable;
              }
            } else if (slotDef.tier === 7) {
              // Apex milestone: slot_7l is 30 SP, slot_7r is 40 SP
              const branchApexAllocated = choiceNodes.filter(
                (cn) => (skillAllocations[cn.id] || 0) > 0
              );
              const is7l = slotId.endsWith('_7l');

              if (is7l) {
                allocatedPoints = branchApexAllocated.length >= 1 ? 1 : 0;
                nodeData = branchApexAllocated[0] || choiceNodes[0];
                if (allocatedPoints > 0) {
                  isAvailable = true;
                  isLocked = false;
                } else {
                  const check = canAllocatePoint(
                    choiceNodes[0].id,
                    skillAllocations,
                    budget,
                    nodeMap
                  );
                  isAvailable = check.allowed;
                  isLocked = !isAvailable;
                }
              } else {
                allocatedPoints = branchApexAllocated.length >= 2 ? 1 : 0;
                nodeData = branchApexAllocated[1] || choiceNodes[1] || choiceNodes[0];
                if (allocatedPoints > 0) {
                  isAvailable = true;
                  isLocked = false;
                } else {
                  const branchSpent = calculateBranchSpent(pos.category, skillAllocations, nodeMap);
                  isAvailable =
                    branchApexAllocated.length >= 1 &&
                    branchSpent >= 40 &&
                    (budget.sandboxMode || budget.remainingSP > 0);
                  isLocked = !isAvailable;
                }
              }
            }
          } else if (slotDef?.primaryNodeId) {
            nodeData = nodeMap.get(slotDef.primaryNodeId);
            if (nodeData) {
              maxPoints = nodeData.maxPoints;
              allocatedPoints = skillAllocations[nodeData.id] || 0;
              const check = canAllocatePoint(nodeData.id, skillAllocations, budget, nodeMap);
              isAvailable = check.allowed;
              isLocked = !check.allowed && allocatedPoints === 0;
            }
          }

          // Calculate lock reason if locked
          let lockMessage: string | null = null;
          if (isLocked) {
            const branchCfg = BRANCH_CONFIGS[pos.category];
            if (pos.tier === 4) {
              lockMessage = `Richiede 10 punti in ${branchCfg.nameIt}`;
            } else if (pos.tier === 7 && slotId.endsWith('_7l')) {
              lockMessage = `Richiede 30 punti in ${branchCfg.nameIt}`;
            } else if (pos.tier === 7 && slotId.endsWith('_7r')) {
              lockMessage = `Richiede 40 punti in ${branchCfg.nameIt}`;
            } else if (!budget.sandboxMode && budget.remainingSP <= 0) {
              lockMessage = 'Punti abilità esauriti (0 SP rimanenti)';
            } else {
              lockMessage = 'Richiede almeno 1 punto nel nodo precedente';
            }
          }

          const isSelected = selectedSlotId === slotId;

          // Left Click Handler: allocate point or open choice for milestone
          const handleNodeClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasMovedRef.current) return;

            const isTouch = typeof window !== 'undefined' && window.innerWidth < 768;
            if (isTouch) {
              // On mobile, tap opens the detail sheet or milestone modal for easy reading and +/- control
              onSelectSlot(slotId);
              return;
            }

            if (slotDef?.choiceNodeIds && slotDef.choiceNodeIds.length > 0) {
              // Milestone slot: opens the centered MilestoneModal to view/select choices
              onSelectSlot(slotId);
            } else if (slotDef?.primaryNodeId) {
              // Desktop regular node: directly allocate +1 point
              allocateSkillPoint(slotDef.primaryNodeId);
            }
          };

          // Right Click Handler: decrement point
          const handleNodeContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (slotDef?.choiceNodeIds && slotDef.choiceNodeIds.length > 0) {
              const activeChoice = choiceNodes.find((cn) => (skillAllocations[cn.id] || 0) > 0);
              if (activeChoice) {
                decrementSkillPoint(activeChoice.id);
              }
            } else if (slotDef?.primaryNodeId) {
              decrementSkillPoint(slotDef.primaryNodeId);
            }
          };

          // Mouse Hover Handlers (only on desktop mouse, disabled on touch mobile to prevent cut-off tooltips)
          const handleNodeMouseEnter = (e: React.MouseEvent) => {
            const isTouch =
              typeof window !== 'undefined' &&
              (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
            if (isTouch) return;

            setHoveredTooltip({
              slotId,
              nodeData,
              choiceNodes,
              allocatedPoints,
              maxPoints,
              category: pos.category,
              tier: pos.tier,
              isMilestone: pos.isMilestone,
              isAvailable,
              isLocked,
              lockMessage,
              clientX: e.clientX,
              clientY: e.clientY,
            });
          };

          const handleNodeMouseMove = (e: React.MouseEvent) => {
            const isTouch =
              typeof window !== 'undefined' &&
              (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
            if (isTouch) return;

            setHoveredTooltip((prev) =>
              prev && prev.slotId === slotId
                ? {
                    ...prev,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    allocatedPoints,
                    isAvailable,
                    isLocked,
                  }
                : prev
            );
          };

          const handleNodeMouseLeave = () => {
            setHoveredTooltip((prev) => (prev?.slotId === slotId ? null : prev));
          };

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
              onClick={handleNodeClick}
              onContextMenu={handleNodeContextMenu}
              onMouseEnter={handleNodeMouseEnter}
              onMouseMove={handleNodeMouseMove}
              onMouseLeave={handleNodeMouseLeave}
            />
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredTooltip && <SkillTooltip {...hoveredTooltip} />}
    </div>
  );
};
