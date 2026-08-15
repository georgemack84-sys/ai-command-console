'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Permission } from '@/generated/permission-catalog';
import { useAuthentication } from '@/lib/auth/auth-context';
import { resolveSafeReturnPath } from '@/lib/auth/return-path';

import { AuthenticationErrorState } from './authentication-error-state';
import { AuthenticationResolutionFrame } from './authentication-resolution-frame';
import { ShellUnauthorizedState } from './shell-unauthorized-state';
import { UnauthorizedState } from './unauthorized-state';

export function ProtectedExperienceBoundary({
  children,
}: React.PropsWithChildren) {
  const { state } = useAuthentication();
  const router = useRouter();
  const pathname = usePathname();
  const sessionEnded = state.status === 'unauthenticated' && state.sessionEnded;
  useEffect(() => {
    if (state.status === 'unauthenticated') {
      const reason = sessionEnded ? '&reason=session-ended' : '';
      router.replace(
        `/login?returnTo=${encodeURIComponent(resolveSafeReturnPath(pathname))}${reason}`,
      );
    }
  }, [pathname, router, sessionEnded, state.status]);
  if (state.status === 'authenticated') {
    if (!state.user.permissions.has(Permission.AuthenticatedAccess))
      return <ShellUnauthorizedState />;
    return <>{children}</>;
  }
  if (state.status === 'unauthorized') return <UnauthorizedState />;
  if (state.status === 'error') return <AuthenticationErrorState />;
  return <AuthenticationResolutionFrame />;
}
