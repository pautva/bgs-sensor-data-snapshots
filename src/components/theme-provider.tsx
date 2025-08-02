'use client';

import * as React from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'bgs-dashboard-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => (typeof window !== 'undefined' ? localStorage?.getItem(storageKey) as Theme : null) || defaultTheme
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    const effectiveTheme = theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;

    root.classList.add(effectiveTheme);
  }, [theme]);

  const value = React.useMemo(() => ({
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage?.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  }), [theme, storageKey]);

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};