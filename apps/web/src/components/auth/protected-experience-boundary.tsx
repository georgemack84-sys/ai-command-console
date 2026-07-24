'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthentication } from '@/lib/auth/auth-context';
import { resolveSafeReturnPath } from '@/lib/auth/return-path';
import { Permission } from '@/generated/permission-catalog';
import { AuthenticationResolutionFrame } from './authentication-resolution-frame';
import { AuthenticationErrorState } from './authentication-error-state';
import { UnauthorizedState } from './unauthorized-state';
import { ShellUnauthorizedState } from './shell-unauthorized-state';

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
