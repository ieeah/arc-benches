import type { FC } from 'react';
import { Hammer } from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/Badge';
import { getWorkbenchBadgeShort, getWorkbenchShortName } from '@/lib/craft';
import type { CraftStatus } from '@/types';
import { useTranslation } from '@/i18n';

export type CraftBadgeProps = {
  workbenchId: string;
  levelRequired: number;
  status: CraftStatus;
  shortLabel?: boolean;
  title?: string;
  size?: BadgeSize;
  className?: string;
};

const ROMAN_NUMERALS: Record<number, string> = {
  1: '',
  2: ' II',
  3: ' III',
  4: ' IV',
  5: ' V',
};

/**
 * Universal badge indicating craftability in hideout workbenches.
 * Shows emerald when ready to craft, amber when bench level or blueprint is missing.
 */
export const CraftBadge: FC<CraftBadgeProps> = ({
  workbenchId,
  levelRequired,
  status,
  shortLabel = false,
  title,
  size = 'md',
  className,
}) => {
  const { t } = useTranslation();

  const isSmall = size === 'sm' || size === 'xs';
  const iconSize = isSmall ? 9 : 10;

  const baseLabel = shortLabel
    ? getWorkbenchBadgeShort(workbenchId, t)
    : getWorkbenchShortName(workbenchId, t);

  const suffix = workbenchId === 'workbench'
    ? ''
    : (ROMAN_NUMERALS[levelRequired] ?? (levelRequired > 1 ? ` ${levelRequired}` : ''));

  const isCraftable = status === 'craftable';

  return (
    <Badge
      variant={isCraftable ? 'emerald' : 'amber'}
      size={size}
      icon={<Hammer size={iconSize} />}
      title={title}
      className={className}
    >
      <span className="uppercase">{baseLabel}{suffix}</span>
    </Badge>
  );
};
