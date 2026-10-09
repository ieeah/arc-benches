import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { useAppStore } from '@/store';
import { useTranslation } from '@/i18n';
import { useFeatureFlags } from '@/lib/featureFlags';
import { ConfirmActionModal } from '@/components/ConfirmActionModal';

/**
 * Via d'uscita per un pass scelto per errore (Impostazioni): nel gioco il pass non si cambia prima
 * di concluderlo, ma nell'app un errore di tocco non deve essere irreversibile. Il progresso si perde.
 */
export const ChangeActivePassSection = () => {
  const { t } = useTranslation();
  const { isEnabled } = useFeatureFlags();
  const activeId = useAppStore((s) => s.activeRewardPass);
  const activeName = useAppStore((s) => s.passes.find((p) => p.id === s.activeRewardPass)?.name);
  const reset = useAppStore((s) => s.resetActiveRewardPass);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isEnabled('reward-pass') || activeId === null) return null;
  const name = activeName ?? activeId;

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[28px] p-5 shadow-sm space-y-3">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Ticket size={14} className="text-purple-500" /> {t('rewardPass.switchTitle')}
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.switchHint', { name })}</p>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="w-full py-2.5 rounded-2xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 cursor-pointer"
      >
        {t('rewardPass.switchButton')}
      </button>

      {confirmOpen && (
        <ConfirmActionModal
          title={t('rewardPass.switchTitle')}
          message={t('rewardPass.switchMessage', { name })}
          description={t('rewardPass.switchDescription')}
          confirmText={t('rewardPass.switchButton')}
          variant="danger"
          onConfirm={reset}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </section>
  );
};
