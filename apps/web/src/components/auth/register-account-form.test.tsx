import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/api-error';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import {
  RegisterAccountForm,
  registrationErrorMessage,
} from './register-account-form';

const completeLogin = vi.fn(async () => undefined);
const context: AuthenticationContextValue = {
  state: { status: 'unauthenticated' },
  refreshAuthentication: async () => undefined,
  completeLogin,
  logout: async () => undefined,
};

function renderForm(
  createAccount: (
    username: string,
    displayName: string,
    password: string,
  ) => Promise<void> = vi.fn(async () => undefined),
) {
  return {
    createAccount,
    ...render(
      <AuthenticationContext.Provider value={context}>
        <RegisterAccountForm createAccount={createAccount} />
      </AuthenticationContext.Provider>,
    ),
  };
}

describe('RegisterAccountForm', () => {
  it('collects new-account credentials with password-manager metadata', () => {
    renderForm();
    expect(
      screen.getByRole('heading', { name: 'Create account' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Name *')).toHaveAttribute(
      'autocomplete',
      'name',
    );
    expect(screen.getByLabelText('Username *')).toHaveAttribute(
      'autocomplete',
      'username',
    );
    expect(screen.getByLabelText('Password *')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('creates one account and refreshes the authoritative session', async () => {
    const createAccount = vi.fn(async () => undefined);
    renderForm(createAccount);
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Alex Example' },
    });
    fireEvent.change(screen.getByLabelText('Username *'), {
      target: { value: 'alex' },
    });
    fireEvent.change(screen.getByLabelText('Password *'), {
      target: { value: 'long-enough-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(completeLogin).toHaveBeenCalled());
    expect(createAccount).toHaveBeenCalledWith(
      'alex',
      'Alex Example',
      'long-enough-password',
    );
  });
});

describe('registrationErrorMessage', () => {
  it('maps supported account-creation errors without exposing raw details', () => {
    expect(registrationErrorMessage(new ApiError('problem', 409))).toMatch(
      /username is unavailable/i,
    );
    expect(registrationErrorMessage(new ApiError('problem', 429))).toMatch(
      /Too many account-creation attempts/,
    );
    expect(registrationErrorMessage(new Error('password=fake-secret'))).toBe(
      'Unable to create your account right now. Please try again.',
    );
  });
});
