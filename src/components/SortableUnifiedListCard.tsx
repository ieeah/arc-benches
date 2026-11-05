import type { ComponentProps } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UnifiedListCard } from '@/components/UnifiedListCard';
import { useTranslation } from '@/i18n';

export const SortableUnifiedListCard = (props: Omit<ComponentProps<typeof UnifiedListCard>, 'dragHandle'>) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.list.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="w-full min-w-0">
      <UnifiedListCard {...props}
        dragHandle={
          <button {...attributes} {...listeners}
            aria-label={t('benches.dragToReorder')}
            title={t('benches.dragToReorder')}
            className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing">
            <GripVertical size={18} />
          </button>
        }
      />
    </div>
  );
};
