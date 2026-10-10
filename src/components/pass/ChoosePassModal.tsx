import type { PassList } from '@/types';
import { BottomSheet } from '@/components/BottomSheet';
import { useTranslation, getListName } from '@/i18n';

interface ChoosePassModalProps {
  /** Pass appena completato. */
  completed: PassList;
  /** Pass tra cui scegliere (più di uno). */
  choices: PassList[];
  onChoose: (passId: string) => void;
  onSkip: () => void;
}

/** Dopo il completamento del pass attivo, se restano più pass da fare chiede quale attivare. */
export const ChoosePassModal = ({ completed, choices, onChoose, onSkip }: ChoosePassModalProps) => {
  const { t, language } = useTranslation();
  return (
    <BottomSheet
      title={t('rewardPass.choosePassTitle')}
      onClose={onSkip}
      overlayZ="z-60"
      footer={
        <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            {t('rewardPass.choosePassSkip')}
          </button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('rewardPass.choosePassHint', { name: getListName(completed, language) })}
        </p>
        <div className="space-y-2">
          {choices.map((pass) => (
            <button
              key={pass.id}
              type="button"
              onClick={() => onChoose(pass.id)}
              className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:border-purple-300 text-left text-sm font-bold cursor-pointer"
            >
              {getListName(pass, language)}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
