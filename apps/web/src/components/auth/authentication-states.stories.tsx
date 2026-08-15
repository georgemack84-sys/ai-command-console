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
      <AuthenticationContext.Provider value={context({ status: 'unknown' })}>
        <LoginForm authenticate={async () => undefined} />
      </AuthenticationContext.Provider>
    </main>
  );
}

export default {
  title: 'Authentication/States',
  component: AuthenticationStates,
} satisfies Meta<typeof AuthenticationStates>;

export const Default: StoryObj<typeof AuthenticationStates> = {};

const loginContext = context({ status: 'unauthenticated' });
const loginStory = (props: React.ComponentProps<typeof LoginForm> = {}) => (
  <AuthenticationContext.Provider value={loginContext}>
    <main className="login-page">
      <LoginForm authenticate={async () => undefined} {...props} />
    </main>
  </AuthenticationContext.Provider>
);

export const LoginDefault: StoryObj<typeof AuthenticationStates> = {
  render: () => loginStory(),
};
export const LoginInvalidCredentials: StoryObj<typeof AuthenticationStates> = {
  render: () =>
    loginStory({ initialError: 'Unable to sign in with those credentials.' }),
};
export const LoginSubmitting: StoryObj<typeof AuthenticationStates> = {
  render: () => loginStory({ submitting: true }),
};
export const LoginRateLimited: StoryObj<typeof AuthenticationStates> = {
  render: () =>
    loginStory({
      initialError: 'Too many sign-in attempts. Please try again later.',
    }),
};
export const LoginServiceUnavailable: StoryObj<typeof AuthenticationStates> = {
  render: () =>
    loginStory({
      initialError: 'Unable to sign in right now. Please try again.',
    }),
};
export const BootstrapLoading: StoryObj<typeof AuthenticationStates> = {
  render: () => <AuthenticationResolutionFrame />,
};
