import { useEffect } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { useAppStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const language = useAppStore(s => s.language);

  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#f9fafb');
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = language || 'it';
  }, [language]);

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ dark: isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
