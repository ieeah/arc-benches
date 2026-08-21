import { useEffect } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { useAppStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);

  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ dark: isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
