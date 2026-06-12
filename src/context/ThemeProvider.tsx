import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { safeLS } from '../lib/safeStorage';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() =>
    safeLS(() => {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }, false)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    safeLS(() => localStorage.setItem('theme', dark ? 'dark' : 'light'), undefined);
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}
