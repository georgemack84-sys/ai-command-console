import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Permission } from '@/generated/permission-catalog';
import type { PermissionKey } from '@/generated/permission-catalog';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import { PermissionGate } from './permission-gate';

function context(
  state: AuthenticationContextValue['state'],
): AuthenticationContextValue {
  return {
    state,
    refreshAuthentication: async () => undefined,
    completeLogin: async () => undefined,
    logout: async () => undefined,
  };
}
function authenticated(permissions: ReadonlySet<PermissionKey>) {
  return {
    status: 'authenticated' as const,
    user: {
      id: 'user-1',
      username: 'operator',
      displayName: 'Operator',
      roles: [],
      permissions,
    },
  };
}
function renderGate(
  state: AuthenticationContextValue['state'],
  gate: React.ReactNode,
) {
  return render(
    <AuthenticationContext.Provider value={context(state)}>
      {gate}
    </AuthenticationContext.Provider>,
  );
}

describe('PermissionGate', () => {
  it('renders only for a granted generated permission', () => {
    renderGate(
      authenticated(new Set([Permission.UserManage])),
      <PermissionGate
        permission={Permission.UserManage}
        fallback={<p>Denied</p>}
      >
        <p>Granted</p>
      </PermissionGate>,
    );
    expect(screen.getByText('Granted')).toBeVisible();
    expect(screen.queryByText('Denied')).not.toBeInTheDocument();
  });
  it('supports any-of and all-of checks', () => {
    renderGate(
      authenticated(new Set([Permission.UserManage, Permission.RoleRead])),
      <>
        <PermissionGate anyOf={[Permission.UserRead, Permission.RoleRead]}>
          <p>Any granted</p>
        </PermissionGate>
        <PermissionGate allOf={[Permission.UserManage, Permission.RoleRead]}>
          <p>All granted</p>
        </PermissionGate>
      </>,
    );
    expect(screen.getByText('Any granted')).toBeVisible();
    expect(screen.getByText('All granted')).toBeVisible();
  });
  it('fails closed during loading and when denied', () => {
    const { rerender } = renderGate(
      { status: 'loading' },
      <PermissionGate
        permission={Permission.UserManage}
        fallback={<p>Unavailable</p>}
      >
        <p>Protected action</p>
      </PermissionGate>,
    );
    expect(screen.queryByText('Protected action')).not.toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeVisible();
    rerender(
      <AuthenticationContext.Provider value={context(authenticated(new Set()))}>
        <PermissionGate
          permission={Permission.UserManage}
          fallback={<p>Unavailable</p>}
        >
          <p>Protected action</p>
        </PermissionGate>
      </AuthenticationContext.Provider>,
    );
    expect(screen.queryByText('Protected action')).not.toBeInTheDocument();
  });
});
