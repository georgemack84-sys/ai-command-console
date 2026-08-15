import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import { LoginExperienceBoundary } from './login-experience-boundary';

const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(query),
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
      <LoginExperienceBoundary>
        <p>Login form</p>
      </LoginExperienceBoundary>
    </AuthenticationContext.Provider>,
  );
}

describe('LoginExperienceBoundary', () => {
  it('shows no login form while the authoritative session is unknown', () => {
    renderBoundary({ status: 'unknown' });
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
    expect(screen.getByText('Resolving your session…')).toBeVisible();
  });
  it('shows the login form only after an unauthenticated result', () => {
    query = 'reason=session-ended';
    renderBoundary({ status: 'unauthenticated', sessionEnded: true });
    expect(screen.getByText('Login form')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('session ended');
  });
  it('redirects authenticated users to a safe internal destination', async () => {
    query = 'returnTo=%2Fcomponents%3Ftab%3Dcore';
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
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/components?tab=core'),
    );
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });
  it('rejects an external return destination', async () => {
    query = 'returnTo=https%3A%2F%2Fattacker.invalid';
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
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
});
