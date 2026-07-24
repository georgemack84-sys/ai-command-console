'use client';
import { ThemeProvider } from './theme-provider';
import { AuthenticationProvider } from '@/lib/auth/auth-provider';
export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider>
      <AuthenticationProvider>{children}</AuthenticationProvider>
    </ThemeProvider>
  );
}
