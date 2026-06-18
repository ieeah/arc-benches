import type { ComponentProps } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListRow } from './ListRow';

export const SortableListRow = (props: Omit<ComponentProps<typeof ListRow>, 'dragHandle'>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.list.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <ListRow {...props}
        dragHandle={
          <button {...attributes} {...listeners}
            className="text-gray-300 dark:text-gray-600 touch-none cursor-grab active:cursor-grabbing">
            <GripVertical size={18} />
          </button>
        }
      />
    </div>
  );
};
