/** Row of tappable level pills (min..max). Levels below minSelectable are disabled. */
export const LevelPills = ({ min = 0, max, value, minSelectable = 0, activeClass, onChange }: {
  min?: number; max: number; value: number; minSelectable?: number;
  activeClass: string; onChange: (v: number) => void;
}) => (
  <div className="flex gap-1.5 flex-wrap">
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(lvl => {
      const disabled = lvl < minSelectable;
      return (
        <button key={lvl} onClick={() => onChange(lvl)} disabled={disabled}
          className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
            lvl === value ? activeClass
            : disabled ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
          {lvl}
        </button>
      );
    })}
  </div>
);
