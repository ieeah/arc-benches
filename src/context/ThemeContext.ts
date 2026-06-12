import { createContext, useContext } from 'react';

export type ThemeContextValue = { dark: boolean; toggle: () => void };

export const ThemeContext = createContext<ThemeContextValue>({ dark: false, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);
