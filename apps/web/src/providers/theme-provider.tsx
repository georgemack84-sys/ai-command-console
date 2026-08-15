'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  getSystemTheme,
  observeSystemTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/theme';

export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

function applyRootTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readThemePreference(),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );
  const resolvedTheme = resolveTheme(preference, systemTheme);

  useEffect(() => {
    applyRootTheme(resolvedTheme);
    return preference === 'system'
      ? observeSystemTheme((theme) => {
          setSystemTheme(theme);
        })
      : undefined;
  }, [preference, resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeThemePreference(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
