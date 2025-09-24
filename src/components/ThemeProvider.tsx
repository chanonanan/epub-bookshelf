import { type ReactNode } from 'react';
import { ThemeProvider as InternalThemeProvider, useTheme } from '@/hooks/useTheme';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  return (
    <InternalThemeProvider defaultTheme={defaultTheme} storageKey={storageKey}>
      {children}
    </InternalThemeProvider>
  );
}

export { useTheme };
