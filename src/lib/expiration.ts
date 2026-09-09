import type { List } from '@/types';

/**
 * Checks whether a list has an expiration date and that date is in the past.
 */
export function isListExpired(list: Pick<List, 'expirationDate'>, now: number = Date.now()): boolean {
  if (!list.expirationDate) return false;
  const exp = new Date(list.expirationDate).getTime();
  if (isNaN(exp)) return false;
  return exp <= now;
}

export interface TimeRemainingInfo {
  isExpired: boolean;
  text: string;
  urgent: boolean;  // < 24h
  warning: boolean; // <= 3d
}

/**
 * Formats the time remaining before a given ISO date expiration.
 */
export function formatTimeRemaining(
  expirationDate: string | undefined,
  language: string = 'it',
  now: number = Date.now(),
): TimeRemainingInfo {
  if (!expirationDate) {
    return { isExpired: false, text: '', urgent: false, warning: false };
  }
  const exp = new Date(expirationDate).getTime();
  if (isNaN(exp)) {
    return { isExpired: false, text: '', urgent: false, warning: false };
  }

  const diff = exp - now;
  const isIt = language === 'it';

  if (diff <= 0) {
    return {
      isExpired: true,
      text: isIt ? 'Scaduto' : 'Expired',
      urgent: true,
      warning: false,
    };
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  let text = '';
  if (days >= 1) {
    text = isIt ? `${days}g ${hours}h` : `${days}d ${hours}h`;
  } else if (totalHours >= 1) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${Math.max(1, minutes)}m`;
  }

  const urgent = totalHours < 24;
  const warning = !urgent && totalHours <= 72;

  return {
    isExpired: false,
    text,
    urgent,
    warning,
  };
}
