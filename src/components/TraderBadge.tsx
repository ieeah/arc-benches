import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/Badge';
import { getTraderDisplayName } from '@/lib/traders';
import type { QuestTrader } from '@/types';
import { cn } from '@/lib/cn';

export interface TraderBadgeProps {
  trader: QuestTrader | string;
  price?: number;
  title?: string;
  size?: BadgeSize;
  className?: string;
}

/**
 * Badge derivato per indicare la disponibilità d'acquisto da un commerciante di Speranza.
 */
export const TraderBadge: React.FC<TraderBadgeProps> = ({
  trader,
  price,
  title,
  size = 'md',
  className,
}) => {
  const displayName = getTraderDisplayName(trader);
  const isSmall = size === 'sm' || size === 'xs';
  const iconSize = isSmall ? 7.5 : 9.5;

  const defaultTitle = price != null
    ? `${displayName} (${price.toLocaleString()} Coins)`
    : displayName;

  return (
    <Badge
      variant="sky"
      size={size}
      icon={<ShoppingCart size={iconSize} />}
      title={title ?? defaultTitle}
      className={cn(isSmall ? 'max-w-[65px]' : 'max-w-[90px]', className)}
    >
      {displayName}
    </Badge>
  );
};
