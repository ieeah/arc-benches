import { useState, type ReactNode } from 'react';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';
import { useTranslation } from '@/i18n';
import type { LevelBlocker } from '@/lib/levelRequirements';

type CascadeEffect = { name: string; from: number; to: number };

/**
 * Controllo prima di cambiare il livello corrente di una lista con requisiti su altre liste (#87):
 * - salendo oltre un livello bloccato non si procede e si spiega cosa serve (es. «porta prima Outpost al Lvl 2»);
 * - scendendo sotto un livello richiesto da altre liste si chiede conferma: scenderanno anche loro.
 * `check` restituisce `true` solo se si può procedere subito; la conferma della discesa a catena richiama
 * `onCascadeConfirmed` con il livello richiesto.
 */
export function useLevelGuard({
  current,
  levelBlocker,
  cascadeFor,
  onCascadeConfirmed,
}: {
  current: number;
  levelBlocker?: (level: number) => LevelBlocker | null;
  cascadeFor?: (level: number) => CascadeEffect[];
  onCascadeConfirmed: (level: number) => void;
}): { check: (level: number) => boolean; dialogs: ReactNode } {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState<LevelBlocker | null>(null);
  const [cascade, setCascade] = useState<{ level: number; effects: CascadeEffect[] } | null>(null);

  const check = (level: number): boolean => {
    if (level > current) {
      const blocker = levelBlocker?.(level) ?? null;
      if (blocker) {
        setBlocked(blocker);
        return false;
      }
    } else if (level < current) {
      const effects = cascadeFor?.(level) ?? [];
      if (effects.length > 0) {
        setCascade({ level, effects });
        return false;
      }
    }
    return true;
  };

  const dialogs = (
    <>
      {blocked && (
        <ConfirmActionModal
          title={t('requires.blockedTitle')}
          message={t('requires.blockedMessage', {
            blocked: String(blocked.blockedLevel),
            name: blocked.requiredList,
            level: String(blocked.requiredLevel),
          })}
          confirmText={t('requires.blockedOk')}
          variant="warning"
          onConfirm={() => setBlocked(null)}
          onClose={() => setBlocked(null)}
        />
      )}
      {cascade && (
        <ConfirmActionModal
          title={t('requires.cascadeTitle')}
          message={t('requires.cascadeMessage', {
            effects: cascade.effects
              .map((e) => t('requires.effect', { name: e.name, from: String(e.from), to: String(e.to) }))
              .join(', '),
          })}
          description={t('requires.cascadeDescription')}
          confirmText={t('requires.cascadeConfirm')}
          variant="warning"
          onConfirm={() => {
            onCascadeConfirmed(cascade.level);
            setCascade(null);
          }}
          onClose={() => setCascade(null)}
        />
      )}
    </>
  );

  return { check, dialogs };
}
