import type { ComponentProps } from 'react';
import { EyeOff, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListTypeBadge, UnifiedListCard } from '@/components/UnifiedListCard';
import { useTranslation, getListName } from '@/i18n';

type SortableUnifiedListCardProps = Omit<ComponentProps<typeof UnifiedListCard>, 'dragHandle'> & {
  isFilteredOut?: boolean;
  showGhost?: boolean;
};

export const SortableUnifiedListCard = ({
  isFilteredOut = false,
  showGhost = false,
  ...props
}: SortableUnifiedListCardProps) => {
  const { t, language } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.list.id });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  if (isFilteredOut && !showGhost) {
    return (
      <div
        ref={setNodeRef}
        data-sortable-id={props.list.id}
        style={style}
        className="h-0 overflow-hidden opacity-0 pointer-events-none m-0 p-0 border-0"
        aria-hidden="true"
      />
    );
  }

  if (isFilteredOut && showGhost) {
    const listName = getListName(props.list, language);

    return (
      <div ref={setNodeRef} data-sortable-id={props.list.id} style={style} className="w-full min-w-0">
        <div className="mb-2 px-3 py-1.5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {props.priorityRank !== undefined && (
              <span className="shrink-0 font-mono text-[10px] font-extrabold tabular-nums px-1.5 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                #{props.priorityRank}
              </span>
            )}
            <ListTypeBadge list={props.list} />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              {listName}
            </span>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            <EyeOff size={11} />
            {t('lists.filteredGhostHint')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} data-sortable-id={props.list.id} style={style} className="w-full min-w-0">
      <UnifiedListCard
        {...props}
        forceCollapsed={isDragging}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            aria-label={t('benches.dragToReorder')}
            title={t('benches.dragToReorder')}
            className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </button>
        }
      />
    </div>
  );
};
