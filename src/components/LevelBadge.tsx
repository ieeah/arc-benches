export const LevelBadge = ({ current, max, state = 'default' }: {
  current: number; max: number; state?: 'ready' | 'maxed' | 'default';
}) => (
  <span className={`text-sm font-bold shrink-0 ${
    state === 'ready' ? 'text-green-500'
    : state === 'maxed' ? 'text-gray-400 dark:text-gray-600'
    : 'text-blue-400'
  }`}>
    Lvl {current}/{max}
  </span>
);
