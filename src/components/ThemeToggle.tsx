import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { IconButton } from './IconButton';

export const ThemeToggle = () => {
  const { dark, toggle } = useTheme();
  return (
    <IconButton onClick={toggle} title="Cambia tema">
      {dark ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-gray-500" />}
    </IconButton>
  );
};
