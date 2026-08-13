'use client';
import { AuthenticationProvider } from '@/lib/auth/auth-provider';

import { ThemeProvider } from './theme-provider';
export function AppProviders({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider>
      <AuthenticationProvider>{children}</AuthenticationProvider>
    </ThemeProvider>
  );
}
