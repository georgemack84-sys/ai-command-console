import assert from 'node:assert/strict';

import { validateAuthenticationUi } from './authentication-ui-policy.mjs';

const valid = {
  packageJson: '"validate:authentication-ui"',
  authState:
    "status: 'unknown' status: 'authenticated' status: 'unauthenticated'",
  authService:
    '/api/v1/auth/login /api/v1/auth/logout /api/v1/auth/me body: { username, password }',
  authProvider: "getCurrentUser status: 'unknown'",
  loginForm:
    '<form autoComplete="username" autoComplete="current-password" type={visible ? \'text\' : \'password\'} status === 429 FieldError',
  loginBoundary:
    "state.status === 'authenticated' router.replace(returnPath) state.status === 'unauthenticated'",
  protectedBoundary: "state.status === 'authenticated' return <>{children}</>",
  returnPath: "defaultAuthenticatedPath = '/dashboard'",
  stories:
    'export const LoginDefault export const LoginInvalidCredentials export const LoginSubmitting export const LoginRateLimited export const LoginServiceUnavailable export const BootstrapLoading',
  browserCertification:
    'invalid-opaque-session Too many sign-in attempts synthetic-valid-password 200%',
  authSources: '',
  backendEndpoints: 'MapPost("/login" MapGet("/me" MapPost("/logout"',
  requestPolicy: "X-Proprium-CSRF '1'",
  documentation:
    '## Backend contract ## Session state model ## No-flash invariant ## Security boundaries ## Validation',
};
const fixtures = [
  [
    'boolean-only state',
    { authState: `${valid.authState} isAuthenticated: boolean` },
    'boolean-only',
  ],
  [
    'browser auth storage',
    { authSources: 'localStorage.setItem("isLoggedIn", "true")' },
    'browser storage',
  ],
  [
    'unsafe return path',
    { returnPath: `${valid.returnPath} return candidate as SafeInternalPath` },
    'bypasses structural validation',
  ],
  [
    'raw backend error',
    { loginForm: `${valid.loginForm} error.message` },
    'raw authentication errors',
  ],
  [
    'missing no-flash evidence',
    {
      browserCertification: valid.browserCertification.replace(
        'invalid-opaque-session',
        '',
      ),
    },
    'invalid-opaque-session',
  ],
];

for (const [name, change, expected] of fixtures) {
  const errors = validateAuthenticationUi({ ...valid, ...change });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join('; ')}`,
  );
}
console.log(
  `Authentication UI controlled failures: PASS (${fixtures.length} rejected fixtures)`,
);
