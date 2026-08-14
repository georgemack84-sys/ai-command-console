import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateAuthenticationUi } from './authentication-ui-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = join(root, '..', '..');
const requiredFiles = [
  'src/lib/auth/auth-state.ts',
  'src/lib/auth/auth-service.ts',
  'src/lib/auth/auth-provider.tsx',
  'src/components/auth/login-form.tsx',
  'src/components/auth/login-experience-boundary.tsx',
  'src/components/auth/protected-experience-boundary.tsx',
  'src/components/auth/authentication-states.stories.tsx',
  'src/components/auth/login-form.test.tsx',
  'src/components/auth/login-experience-boundary.test.tsx',
  'src/components/auth/protected-experience-boundary.test.tsx',
  'src/app/(public)/login/page.tsx',
  'src/app/(protected)/layout.tsx',
  'tests/browser/authentication-boundary.spec.ts',
  'tests/storybook/authentication.spec.ts',
  'docs/authentication-ui.md',
];
const read = (base, path) =>
  existsSync(join(base, path)) ? readFileSync(join(base, path), 'utf8') : '';
const authFiles = [
  'src/lib/auth/auth-state.ts',
  'src/lib/auth/auth-context.ts',
  'src/lib/auth/auth-service.ts',
  'src/lib/auth/auth-provider.tsx',
  'src/components/auth/login-form.tsx',
]
  .map((path) => read(root, path))
  .join('\n');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: required GP-25 artifact is missing`),
  ...validateAuthenticationUi({
    packageJson: read(root, 'package.json'),
    authState: read(root, 'src/lib/auth/auth-state.ts'),
    authService: read(root, 'src/lib/auth/auth-service.ts'),
    authProvider: read(root, 'src/lib/auth/auth-provider.tsx'),
    loginForm: read(root, 'src/components/auth/login-form.tsx'),
    loginBoundary: read(
      root,
      'src/components/auth/login-experience-boundary.tsx',
    ),
    protectedBoundary: read(
      root,
      'src/components/auth/protected-experience-boundary.tsx',
    ),
    returnPath: read(root, 'src/lib/auth/return-path.ts'),
    stories: read(
      root,
      'src/components/auth/authentication-states.stories.tsx',
    ),
    browserCertification: read(root, 'scripts/test-browser.mjs'),
    authSources: authFiles,
    backendEndpoints: read(
      repositoryRoot,
      'services/api/Proprium.Api/Endpoints/AuthenticationEndpoints.cs',
    ),
    requestPolicy: read(root, 'src/lib/api/request-policy.ts'),
    documentation: read(root, 'docs/authentication-ui.md'),
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Authentication UI failure: ${error}`);
  process.exit(1);
}
console.log(
  `Authentication UI contract: PASS (${requiredFiles.length} artifacts, backend parity, fail-closed state, login, safe redirects, browser evidence, and sensitive-data boundaries)`,
);
