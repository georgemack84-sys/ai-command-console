import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Permission } from '@/generated/permission-catalog';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import { ProtectedExperienceBoundary } from './protected-experience-boundary';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace }),
}));

function value(
  state: AuthenticationContextValue['state'],
): AuthenticationContextValue {
  return {
    state,
    refreshAuthentication: async () => undefined,
    completeLogin: async () => undefined,
    logout: async () => undefined,
  };
}
function renderBoundary(state: AuthenticationContextValue['state']) {
  return render(
    <AuthenticationContext.Provider value={value(state)}>
      <ProtectedExperienceBoundary>
        <p>Protected dashboard content</p>
      </ProtectedExperienceBoundary>
    </AuthenticationContext.Provider>,
  );
}

describe('ProtectedExperienceBoundary', () => {
  it('does not mount protected children while authentication resolves', () => {
    renderBoundary({ status: 'loading' });
    expect(
      screen.queryByText('Protected dashboard content'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Resolving your session…')).toBeInTheDocument();
  });
  it('mounts protected children only after an authenticated result', () => {
    renderBoundary({
      status: 'authenticated',
      user: {
        id: 'user-1',
        username: 'operator',
        displayName: 'Operator',
        roles: [],
        permissions: new Set([Permission.AuthenticatedAccess]),
      },
    });
    expect(screen.getByText('Protected dashboard content')).toBeInTheDocument();
  });
  it('redirects unauthenticated users without rendering protected children', async () => {
    renderBoundary({ status: 'unauthenticated', sessionEnded: true });
    expect(
      screen.queryByText('Protected dashboard content'),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        '/login?returnTo=%2Fdashboard&reason=session-ended',
      ),
    );
  });
  it('renders a standalone shell denial without mounting protected children', () => {
    renderBoundary({
      status: 'authenticated',
      user: {
        id: 'user-1',
        username: 'operator',
        displayName: 'Operator',
        roles: [],
        permissions: new Set(),
      },
    });
    expect(
      screen.queryByText('Protected dashboard content'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Your account does not have access to this application.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
