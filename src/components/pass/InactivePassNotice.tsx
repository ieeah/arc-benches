import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { BottomSheet } from '@/components/BottomSheet';
import { useTranslation, getListName } from '@/i18n';
import { isPassAvailable, isPassCompleted } from '@/lib/rewardPass';

/**
 * Avviso una tantum: il pass attivo del profilo è stato tolto dal gioco (`active: false` in `passes.json`).
 * Alla conferma il profilo resta senza pass attivo; il livello raggiunto sul pass resta salvato.
 */
export const InactivePassNotice = () => {
  const { t, language } = useTranslation();
  const activeId = useAppStore((s) => s.activeRewardPass);
  const pass = useAppStore((s) => s.passes.find((p) => p.id === s.activeRewardPass));
  const completed = useAppStore((s) => (pass ? isPassCompleted(pass, s.currentLevels) : false));
  const acknowledge = useAppStore((s) => s.acknowledgeInactiveRewardPass);

  const unavailable = activeId !== null && (!pass || !isPassAvailable(pass));

  // Pass attivo già al livello massimo (dati incoerenti): si risolve in silenzio, senza avviso.
  useEffect(() => {
    if (activeId !== null && !unavailable && completed) acknowledge();
  }, [activeId, unavailable, completed, acknowledge]);

  if (activeId === null || !unavailable) return null;
  const name = pass ? getListName(pass, language) : activeId;

  return (
    <BottomSheet
      title={t('rewardPass.inactiveTitle')}
      onClose={acknowledge}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={acknowledge}
            className="w-full py-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-full cursor-pointer"
          >
            {t('rewardPass.inactiveOk')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
        <AlertTriangle size={28} className="text-amber-500" />
        <p className="text-sm font-bold">{t('rewardPass.inactiveMessage', { name })}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.inactiveDescription')}</p>
      </div>
    </BottomSheet>
  );
};
