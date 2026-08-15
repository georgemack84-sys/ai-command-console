'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthentication } from '@/lib/auth/auth-context';
import { resolveSafeReturnPath } from '@/lib/auth/return-path';

import { AuthenticationErrorState } from './authentication-error-state';
import { AuthenticationResolutionFrame } from './authentication-resolution-frame';
import { UnauthorizedState } from './unauthorized-state';

export function LoginExperienceBoundary({ children }: React.PropsWithChildren) {
  const { state } = useAuthentication();
  const router = useRouter();
  const search = useSearchParams();
  const returnPath = resolveSafeReturnPath(search.get('returnTo'));

  useEffect(() => {
    if (state.status === 'authenticated') router.replace(returnPath);
  }, [returnPath, router, state.status]);

  if (state.status === 'unauthenticated') {
    return (
      <main className="login-page">
        <div className="login-experience">
          {search.get('reason') === 'session-ended' ? (
            <p role="status">Your session ended. Please sign in again.</p>
          ) : null}
          {children}
        </div>
      </main>
    );
  }
  if (state.status === 'error') {
    return (
      <main className="auth-resolution">
        <AuthenticationErrorState />
      </main>
    );
  }
  if (state.status === 'unauthorized') {
    return (
      <main className="auth-resolution">
        <UnauthorizedState />
      </main>
    );
  }
  return <AuthenticationResolutionFrame />;
}
