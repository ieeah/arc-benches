import type { ReactNode } from 'react';
import {
  Bot,
  Zap,
  Wrench,
  Leaf,
  Home,
  HeartPulse,
  Factory,
  Store,
  Shield,
  MapPin,
} from 'lucide-react';

export interface LootAreaInfo {
  id: string;
  label: string;
  icon: ReactNode;
}

function parseSingleLootArea(area: string, iconSize = 13): LootAreaInfo {
  const normalized = area.trim().toLowerCase();

  switch (normalized) {
    case 'arc':
      return {
        id: 'arc',
        label: 'ARC / Robot',
        icon: <Bot size={iconSize} className="text-cyan-500 shrink-0" />,
      };
    case 'electrical':
      return {
        id: 'electrical',
        label: 'Elettrico',
        icon: <Zap size={iconSize} className="text-amber-500 shrink-0" />,
      };
    case 'mechanical':
      return {
        id: 'mechanical',
        label: 'Meccanico',
        icon: <Wrench size={iconSize} className="text-orange-500 shrink-0" />,
      };
    case 'nature':
    case 'wild':
      return {
        id: 'nature',
        label: 'Natura',
        icon: <Leaf size={iconSize} className="text-emerald-500 shrink-0" />,
      };
    case 'residential':
      return {
        id: 'residential',
        label: 'Residenziale',
        icon: <Home size={iconSize} className="text-indigo-500 shrink-0" />,
      };
    case 'medical':
      return {
        id: 'medical',
        label: 'Medico',
        icon: <HeartPulse size={iconSize} className="text-rose-500 shrink-0" />,
      };
    case 'industrial':
      return {
        id: 'industrial',
        label: 'Industriale',
        icon: <Factory size={iconSize} className="text-amber-600 shrink-0" />,
      };
    case 'commercial':
      return {
        id: 'commercial',
        label: 'Commerciale',
        icon: <Store size={iconSize} className="text-blue-500 shrink-0" />,
      };
    case 'security':
    case 'military':
      return {
        id: 'security',
        label: 'Sicurezza / Militare',
        icon: <Shield size={iconSize} className="text-red-500 shrink-0" />,
      };
    default:
      return {
        id: normalized,
        label: area.trim(),
        icon: <MapPin size={iconSize} className="text-gray-400 shrink-0" />,
      };
  }
}

export function getLootAreas(lootArea: string | null | undefined, iconSize = 13): LootAreaInfo[] {
  if (!lootArea || !lootArea.trim()) return [];
  const parts = lootArea.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
  return parts.map(p => parseSingleLootArea(p, iconSize));
}

export function getLootAreaInfo(lootArea: string | null | undefined, iconSize = 13): LootAreaInfo | null {
  const list = getLootAreas(lootArea, iconSize);
  return list[0] ?? null;
}
