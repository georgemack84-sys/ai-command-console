import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/api-error';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import { LoginForm, loginErrorMessage } from './login-form';

const completeLogin = vi.fn(async () => undefined);
const context: AuthenticationContextValue = {
  state: { status: 'unauthenticated' },
  refreshAuthentication: async () => undefined,
  completeLogin,
  logout: async () => undefined,
};
function renderForm(
  authenticate: (username: string, password: string) => Promise<void> = vi.fn(
    async () => undefined,
  ),
) {
  return {
    authenticate,
    ...render(
      <AuthenticationContext.Provider value={context}>
        <LoginForm authenticate={authenticate} />
      </AuthenticationContext.Provider>,
    ),
  };
}

describe('LoginForm', () => {
  it('uses labeled native credential controls and password-manager metadata', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    expect(screen.getByLabelText('Username *')).toHaveAttribute(
      'autocomplete',
      'username',
    );
    expect(screen.getByLabelText('Password *')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByLabelText('Password *')).toHaveAttribute(
      'type',
      'password',
    );
  });
  it('submits credentials once while pending and revalidates the session', async () => {
    let release!: () => void;
    const authenticate = vi.fn(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    renderForm(authenticate);
    fireEvent.change(screen.getByLabelText('Username *'), {
      target: { value: 'operator' },
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'synthetic-password' },
    });
    const form = screen
      .getByRole('button', { name: 'Sign in' })
      .closest('form');
    if (!form) throw new Error('Expected login form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Signing in' })).toBeDisabled();
    release();
    await waitFor(() => expect(completeLogin).toHaveBeenCalled());
    expect(authenticate).toHaveBeenCalledWith('operator', 'synthetic-password');
  });
  it('announces a generic error without rendering submitted credentials', async () => {
    const authenticate = vi.fn(async () => {
      throw new ApiError('authentication', 401);
    });
    renderForm(authenticate);
    fireEvent.change(screen.getByLabelText('Username *'), {
      target: { value: 'unknown-user' },
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'fake-secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to sign in with those credentials.',
    );
    expect(
      screen.queryByText(/unknown-user|fake-secret/),
    ).not.toBeInTheDocument();
  });
});

describe('loginErrorMessage', () => {
  it('maps supported backend outcomes without exposing raw details', () => {
    expect(loginErrorMessage(new ApiError('authentication', 401))).toMatch(
      /those credentials/,
    );
    expect(loginErrorMessage(new ApiError('problem', 429))).toMatch(
      /Too many sign-in attempts/,
    );
    expect(loginErrorMessage(new Error('password=fake-secret'))).toBe(
      'Unable to sign in right now. Please try again.',
    );
  });
});
