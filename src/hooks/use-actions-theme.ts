import { useCallback, useEffect, useState } from 'react';

type ActionsTheme = 'dark' | 'light';

const ACTIONS_THEME_STORAGE_KEY = 'sndp-dev-actions-theme';

function isActionsTheme(value: string): value is ActionsTheme {
  return value === 'dark' || value === 'light';
}

function getInitialTheme(defaultTheme: ActionsTheme): ActionsTheme {
  try {
    const savedTheme = globalThis.localStorage?.getItem(ACTIONS_THEME_STORAGE_KEY);
    if (savedTheme && isActionsTheme(savedTheme)) {
      return savedTheme;
    }
  } catch {
    return defaultTheme;
  }

  return defaultTheme;
}

export function useActionsTheme(defaultTheme: ActionsTheme = 'light') {
  const [theme, setTheme] = useState<ActionsTheme>(() => getInitialTheme(defaultTheme));

  useEffect(() => {
    globalThis.localStorage.setItem(ACTIONS_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}
