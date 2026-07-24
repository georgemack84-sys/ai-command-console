'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/api-error';
import { registerAuthenticationFailureHandler } from '@/lib/api/api-client';
import { endSession, getCurrentUser } from './auth-service';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from './auth-context';
import type { AuthenticationState } from './auth-state';

export function AuthenticationProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<AuthenticationState>({
    status: 'loading',
  });
  const generation = useRef(0);
  const active = useRef<AbortController | undefined>(undefined);
  const hasResolvedAuthenticated = useRef(false);
  const invalidateSession = useCallback(() => {
    if (!hasResolvedAuthenticated.current) return;
    hasResolvedAuthenticated.current = false;
    ++generation.current;
    active.current?.abort();
    setState({ status: 'unauthenticated', sessionEnded: true });
  }, []);
  const resolve = useCallback(async () => {
    const request = ++generation.current;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState({ status: 'loading' });
    try {
      const user = await getCurrentUser(controller.signal);
      if (request === generation.current) {
        hasResolvedAuthenticated.current = true;
        setState({ status: 'authenticated', user });
      }
    } catch (error) {
      if (controller.signal.aborted || request !== generation.current) return;
      if (error instanceof ApiError && error.kind === 'authentication') {
        hasResolvedAuthenticated.current = false;
        setState({ status: 'unauthenticated' });
      } else if (error instanceof ApiError && error.kind === 'authorization')
        setState({ status: 'unauthorized' });
      else
        setState({
          status: 'error',
          correlationId:
            error instanceof ApiError
              ? error.problem?.correlationId
              : undefined,
        });
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(resolve);
    return () => active.current?.abort();
  }, [resolve]);
  useEffect(
    () => registerAuthenticationFailureHandler(invalidateSession),
    [invalidateSession],
  );
  const logout = useCallback(async () => {
    ++generation.current;
    active.current?.abort();
    hasResolvedAuthenticated.current = false;
    try {
      await endSession();
    } finally {
      setState({ status: 'unauthenticated' });
    }
  }, []);
  const value = useMemo<AuthenticationContextValue>(
    () => ({
      state,
      refreshAuthentication: resolve,
      completeLogin: resolve,
      logout,
    }),
    [logout, resolve, state],
  );
  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
}
