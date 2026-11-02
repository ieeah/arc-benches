import React from 'react';
import { Hammer } from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/Badge';

export interface RefinerBadgeProps {
  craftLevel: number;
  craftableNow: boolean;
  shortLabel?: boolean;
  title?: string;
  size?: BadgeSize;
  className?: string;
}

/**
 * Badge derivato per indicare la fabbricabilità nel Refiner del rifugio.
 */
export const RefinerBadge: React.FC<RefinerBadgeProps> = ({
  craftLevel,
  craftableNow,
  shortLabel = false,
  title,
  size = 'md',
  className,
}) => {
  const isSmall = size === 'sm' || size === 'xs';
  const iconSize = isSmall ? 7.5 : 9.5;
  const label = shortLabel ? 'Ref' : 'Refiner';
  const ROMAN_NUMERALS: Record<number, string> = {
    1: '',
    2: ' II',
    3: ' III',
    4: ' IV',
    5: ' V',
  };
  const suffix = ROMAN_NUMERALS[craftLevel] ?? (craftLevel > 1 ? ` ${craftLevel}` : '');

  return (
    <Badge
      variant={craftableNow ? 'emerald' : 'amber'}
      size={size}
      icon={<Hammer size={iconSize} />}
      title={title}
      className={className}
    >
      <span className="uppercase">{label}{suffix}</span>
    </Badge>
  );
};
