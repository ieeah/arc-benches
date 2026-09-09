import { ChevronRight, Copy, AlertCircle } from 'lucide-react';
import type { List, ListType } from '@/types';
import { cn } from '@/lib/cn';
import { validateExpeditionIndex } from '@/lib/validate';
import { getListName } from '@/i18n';
import { useTranslation } from '@/i18n';

interface DevListCardProps {
  list: List;
  isSelected: boolean;
  expeditionLists: List[];
  typeIcon: React.ReactNode;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
}

/** Card singola lista nella sidebar del Dev Studio Liste. */
export const DevListCard = ({
  list,
  isSelected,
  expeditionLists,
  typeIcon,
  onSelect,
  onDuplicate,
}: DevListCardProps) => {
  const { language } = useTranslation();

  const displayName = getListName(list, language);
  const expValidation =
    list.listType === 'expedition'
      ? validateExpeditionIndex(list.expeditionIndex ?? 0, list.id, expeditionLists)
      : null;

  return (
    <div
      className={cn(
        'w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group',
        isSelected
          ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-xs'
          : 'bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 pr-2 text-left cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          {typeIcon}
          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </p>
          {expValidation && !expValidation.isValid && (
            <span
              className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 font-bold text-[9px] flex items-center gap-0.5 shrink-0"
              title={expValidation.error ?? 'Indice non valido'}
            >
              <AlertCircle size={9} />
              Errore
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 flex-wrap">
          <span className="font-mono">{list.id}</span>
          {list.listType === 'expedition' && list.expeditionIndex !== undefined && (
            <>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                Idx #{list.expeditionIndex}
              </span>
            </>
          )}
          <span>•</span>
          <span>{list.levels.length} Lvl</span>
          {list.translations?.it?.name && (
            <>
              <span>•</span>
              <span className="text-blue-500 font-medium">IT</span>
            </>
          )}
          {list.expirationDate && (
            <>
              <span>•</span>
              <span className="text-amber-500 font-medium">Scade</span>
            </>
          )}
        </div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onDuplicate}
          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
          title="Duplica questa lista"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="p-1 text-gray-400 group-hover:translate-x-0.5 transition-transform cursor-pointer"
        >
          <ChevronRight
            size={14}
            className={cn('text-gray-400', isSelected && 'text-purple-600 dark:text-purple-400')}
          />
        </button>
      </div>
    </div>
  );
};
