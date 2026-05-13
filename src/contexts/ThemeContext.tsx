import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Component: ThemeProvider
 * Purpose: Persists the user's light/dark preference in localStorage and
 * applies the corresponding Tailwind class to the document root.
 * Consuming components call useTheme() to read or toggle the current theme.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Restore persisted preference on first render; default to light
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'light';
  });

  // Sync the <html> class and localStorage whenever the theme changes.
  // Tailwind's dark-mode variant relies on the 'dark' class being present on <html>.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
