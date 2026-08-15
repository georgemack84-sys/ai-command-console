'use client';
import { createContext, useContext } from 'react';

import type { AuthenticationState } from './auth-state';

export interface AuthenticationOperations {
  refreshAuthentication(): Promise<void>;
  completeLogin(): Promise<void>;
  logout(): Promise<void>;
}
export interface AuthenticationContextValue extends AuthenticationOperations {
  state: AuthenticationState;
}
export const AuthenticationContext =
  createContext<AuthenticationContextValue | null>(null);
export function useAuthentication(): AuthenticationContextValue {
  const value = useContext(AuthenticationContext);
  if (!value) throw new Error('AuthenticationProvider is required.');
  return value;
}
