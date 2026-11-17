import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge, type BadgeSize } from '@/components/Badge';
import { getTraderDisplayName, getTraderCurrency, type TraderId } from '@/lib/traders';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/cn';

export type TraderBadgeProps = {
  trader: TraderId | string;
  price?: number;
  dailyLimit?: number;
  title?: string;
  size?: BadgeSize;
  className?: string;
};

/**
 * Badge derivato per indicare la disponibilità d'acquisto da un commerciante di Speranza.
 */
export const TraderBadge: React.FC<TraderBadgeProps> = ({
  trader,
  price,
  dailyLimit,
  title,
  size = 'md',
  className,
}) => {
  const { t, language } = useTranslation();
  const displayName = getTraderDisplayName(trader, language);
  const currency = getTraderCurrency(trader);
  const currencyLabel = currency === 'seeds'
    ? t('common.seeds')
    : currency === 'barter'
      ? t('common.barter')
      : t('common.coins');

  const isSmall = size === 'sm' || size === 'xs';
  const iconSize = isSmall ? 9 : 10;

  const limitSuffix = dailyLimit != null
    ? ` • ${t('traders.dailyLimitNoticeShort', { limit: dailyLimit })} • ${t('traders.dailyResetAtUtc')}`
    : '';

  const defaultTitle = price != null
    ? `${displayName} (${price.toLocaleString(language)} ${currencyLabel}${limitSuffix})`
    : `${displayName}${limitSuffix}`;

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
