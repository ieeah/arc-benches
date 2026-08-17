import { useState, useEffect, useRef, useMemo } from 'react';

export interface PillItem {
  id: string;
  label: string;
  count?: number;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ScrollablePillListProps {
  items: PillItem[];
  bleedType?: 'full' | 'left-only';
}

export const ScrollablePillList = ({
  items,
  bleedType = 'full',
}: ScrollablePillListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) {
      const scrollable = el.scrollWidth > el.clientWidth;
      setShowLeftShadow(scrollable && el.scrollLeft > 2);
      setShowRightShadow(scrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    }
  };

  const handleDragScroll = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    
    const el = e.currentTarget;
    el.style.scrollBehavior = 'auto';
    const startX = e.pageX - el.offsetLeft;
    const scrollLeft = el.scrollLeft;
    
    const preventSelect = (evt: Event) => evt.preventDefault();
    window.addEventListener('selectstart', preventSelect);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      el.style.scrollBehavior = '';
      window.removeEventListener('selectstart', preventSelect);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    const checkScrollability = () => {
      const el = containerRef.current;
      if (el) {
        const scrollable = el.scrollWidth > el.clientWidth;
        setIsScrollable(scrollable);
        setShowLeftShadow(scrollable && el.scrollLeft > 2);
        setShowRightShadow(scrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
      }
    };
    
    const timer = setTimeout(checkScrollability, 50);
    window.addEventListener('resize', checkScrollability);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [items]);

  const maskStyle = useMemo(() => {
    const leftFade = showLeftShadow ? 'transparent' : 'black';
    const rightFade = showRightShadow ? 'transparent' : 'black';
    const mask = `linear-gradient(to right, ${leftFade}, black 24px, black calc(100% - 24px), ${rightFade})`;
    
    return {
      maskImage: mask,
      WebkitMaskImage: mask,
    };
  }, [showLeftShadow, showRightShadow]);

  const wrapperClass = bleedType === 'full' 
    ? 'relative -mx-6 overflow-hidden' 
    : 'relative flex-1 min-w-0 overflow-hidden -ml-6';

  const containerClass = bleedType === 'full'
    ? 'flex gap-1.5 overflow-x-auto px-6 pb-1 scrollbar-none overscroll-contain select-none'
    : 'flex gap-1.5 overflow-x-auto pl-6 pr-4 pb-1 scrollbar-none overscroll-contain select-none';

  return (
    <div className={wrapperClass}>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={isScrollable ? handleDragScroll : undefined}
        style={maskStyle}
        className={`${containerClass} ${isScrollable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => !item.isDisabled && item.onClick()}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              item.isSelected
                ? 'bg-blue-600 text-white shadow-sm cursor-default'
                : item.isDisabled
                  ? 'bg-gray-150/80 dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-300/40 dark:border-gray-800/80 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="text-[10px] font-bold opacity-60">({item.count})</span>
            )}
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
