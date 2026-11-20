import { translate } from '@/i18n';
import { getTimeRemainingPure, isListExpired } from '@/engine/expeditions';

export { isListExpired };

export type TimeRemainingInfo = {
  isExpired: boolean;
  text: string;
  urgent: boolean;  // < 24h
  warning: boolean; // <= 3d
};

/**
 * Formats the time remaining before a given ISO date expiration.
 */
export function formatTimeRemaining(
  expirationDate: string | undefined,
  language: string = 'it',
  now: number = Date.now(),
): TimeRemainingInfo {
  const remaining = getTimeRemainingPure(expirationDate, now);
  if (remaining.status === 'none') {
    return { isExpired: false, text: '', urgent: false, warning: false };
  }
  if (remaining.status === 'expired') {
    return {
      isExpired: true,
      text: translate(language, 'lists.expired'),
      urgent: true,
      warning: false,
    };
  }

  let text = '';
  const dayUnit = translate(language, 'common.dayShort') || 'd';
  if (remaining.days >= 1) {
    text = `${remaining.days}${dayUnit} ${remaining.hours}h`;
  } else if (remaining.totalHours >= 1) {
    text = `${remaining.hours}h ${remaining.minutes}m`;
  } else {
    text = `${Math.max(1, remaining.minutes)}m`;
  }

  return {
    isExpired: false,
    text,
    urgent: remaining.urgent,
    warning: remaining.warning,
  };
}
