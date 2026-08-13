import { Permission } from '@/generated/permission-catalog';
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from '@/lib/auth/auth-context';

import { AuthenticationErrorState } from './authentication-error-state';
import { AuthenticationResolutionFrame } from './authentication-resolution-frame';
import { LoginForm } from './login-form';
import { ShellUnauthorizedState } from './shell-unauthorized-state';
import { UnauthorizedState } from './unauthorized-state';

import type { Meta, StoryObj } from '@storybook/react';

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

function AuthenticationStates() {
  return (
    <main style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 640 }}>
      <section>
        <h1>Authentication states</h1>
        <AuthenticationResolutionFrame />
      </section>
      <AuthenticationContext.Provider value={context({ status: 'error' })}>
        <AuthenticationErrorState />
      </AuthenticationContext.Provider>
      <UnauthorizedState />
      <AuthenticationContext.Provider
        value={context({
          status: 'authenticated',
          user: {
            id: 'user-1',
            username: 'operator',
            displayName: 'Operator',
            roles: [],
            permissions: new Set([Permission.ProfileReadSelf]),
          },
        })}
      >
        <ShellUnauthorizedState />
      </AuthenticationContext.Provider>
      <AuthenticationContext.Provider value={context({ status: 'loading' })}>
        <LoginForm />
      </AuthenticationContext.Provider>
    </main>
  );
}

export default {
  title: 'Authentication/States',
  component: AuthenticationStates,
} satisfies Meta<typeof AuthenticationStates>;

export const Default: StoryObj<typeof AuthenticationStates> = {};
