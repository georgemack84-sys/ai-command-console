'use client';
import { ThemeProvider } from './theme-provider';
export function AppProviders({ children }: React.PropsWithChildren) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
