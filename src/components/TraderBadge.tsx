import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/Badge';
import { getTraderDisplayName, type TraderId } from '@/lib/traders';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

export interface TraderBadgeProps {
  trader: TraderId | string;
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
  const { t, language } = useTranslation();
  const displayName = getTraderDisplayName(trader);
  const isSmall = size === 'sm' || size === 'xs';
  const iconSize = isSmall ? 9 : 10;

  const defaultTitle = price != null
    ? `${displayName} (${price.toLocaleString(language === 'en' ? 'en-US' : 'it-IT')} ${t('common.coins')})`
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
