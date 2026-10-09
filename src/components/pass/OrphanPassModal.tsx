import { AlertTriangle } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { useTranslation } from '@/i18n';

interface OrphanPassModalProps {
  passId: string;
  onCompleted: () => void;
  onAbandoned: () => void;
  /** Rimanda la scelta: il pass resta «attivo» e la domanda si ripresenta alla prossima visita. */
  onLater: () => void;
}

/**
 * Il pass attivo del profilo non esiste più nei dati dell'app (rimosso o rinominato). Finché non c'è
 * un archivio dei vecchi pass, si chiede all'utente se segnarlo come completato (storico/trofei) o no.
 */
export const OrphanPassModal = ({ passId, onCompleted, onAbandoned, onLater }: OrphanPassModalProps) => {
  const { t } = useTranslation();
  return (
    <BottomSheet
      title={t('rewardPass.orphanTitle')}
      onClose={onLater}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button
            type="button"
            onClick={onCompleted}
            className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full cursor-pointer"
          >
            {t('rewardPass.orphanCompleted')}
          </button>
          <button
            type="button"
            onClick={onAbandoned}
            className="w-full py-3 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-full cursor-pointer"
          >
            {t('rewardPass.orphanAbandoned')}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            {t('rewardPass.orphanLater')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 px-2 space-y-3">
        <div className="w-12 h-12 rounded-2xl border flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="text-amber-500" size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('rewardPass.orphanMessage', { id: passId })}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('rewardPass.orphanDescription')}</p>
        </div>
      </div>
    </BottomSheet>
  );
};
