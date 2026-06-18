import { cn } from "../lib/cn";

type CommonProps = {
  min?: number;
  max: number;
  activeClass: string;
};

/** Single-select mode (e.g. current level): one pill highlighted, lower pills optionally locked. */
type SingleProps = CommonProps & {
  value: number;
  minSelectable?: number;
  onChange: (v: number) => void;
  selected?: undefined;
  onToggle?: undefined;
  doneUpTo?: undefined;
};

/** Multi-toggle mode (e.g. objective levels): each pill toggles; levels ≤ doneUpTo shown as done. */
type MultiProps = CommonProps & {
  selected: number[];
  onToggle: (v: number) => void;
  doneUpTo?: number;
  value?: undefined;
  minSelectable?: undefined;
  onChange?: undefined;
};

/** Row of level pills (min..max), single-select or multi-toggle depending on props. */
export const LevelPills = (props: SingleProps | MultiProps) => {
  const { min = 0, max, activeClass } = props;
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="flex gap-1.5 flex-wrap">
      {levels.map((lvl) => {
        if (props.onToggle) {
          // Every level toggles freely — objective selection is independent of the current level.
          const active = props.selected.includes(lvl);
          const done = props.doneUpTo !== undefined && lvl <= props.doneUpTo;
          // Livelli obiettivo
          return (
            <button
              key={lvl}
              onClick={() => props.onToggle(lvl)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-bold transition-colors",
                active && activeClass,
                !active &&
                  done &&
                  "bg-green-500/10 text-green-600/80 dark:text-green-400/70",
                !active &&
                  !done &&
                  "bg-gray-100 dark:bg-gray-800 text-gray-500",
              )}
            >
              {lvl}
            </button>
          );
        }

        const disabled =
          props.minSelectable !== undefined && lvl < props.minSelectable;
        const isActive = lvl === props.value;
        // Livello corrente
        return (
          <button
            key={lvl}
            disabled={disabled}
            onClick={() => props.onChange(lvl)}
            className={cn(
              "w-8 h-8 rounded-full text-xs font-bold transition-colors",
              isActive && activeClass,
              !isActive &&
                disabled &&
                "opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400",
              !isActive &&
                !disabled &&
                "bg-gray-100 dark:bg-gray-800 text-gray-500",
            )}
          >
            {lvl}
          </button>
        );
      })}
    </div>
  );
};
