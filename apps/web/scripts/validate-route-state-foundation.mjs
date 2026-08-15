import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateRouteStateFoundation } from './route-state-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'src/ui/route-states/route-loading-state.tsx',
  'src/ui/route-states/route-terminal-states.tsx',
  'src/ui/route-states/route-states.css',
  'src/ui/route-states/route-states.stories.tsx',
  'src/app/loading.tsx',
  'src/app/error.tsx',
  'src/app/not-found.tsx',
  'src/app/global-error.tsx',
  'src/app/(protected)/loading.tsx',
  'src/app/(protected)/error.tsx',
  'src/app/(protected)/not-found.tsx',
  'tests/unit/route-states.test.tsx',
  'tests/unit/route-boundaries.test.tsx',
  'tests/storybook/route-states.spec.ts',
  'docs/route-state-ux.md',
];
const read = (path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
const tokens = ['primitives.css', 'semantic.css', 'themes.css', 'motion.css']
  .map((name) => read(`src/styles/tokens/${name}`))
  .join('\n');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: required route-state artifact is missing`),
  ...validateRouteStateFoundation({
    loading: read('src/ui/route-states/route-loading-state.tsx'),
    terminalStates: read('src/ui/route-states/route-terminal-states.tsx'),
    styles: read('src/ui/route-states/route-states.css'),
    stories: read('src/ui/route-states/route-states.stories.tsx'),
    rootLoading: read('src/app/loading.tsx'),
    rootError: read('src/app/error.tsx'),
    rootNotFound: read('src/app/not-found.tsx'),
    protectedLoading: read('src/app/(protected)/loading.tsx'),
    protectedError: read('src/app/(protected)/error.tsx'),
    protectedNotFound: read('src/app/(protected)/not-found.tsx'),
    globalError: read('src/app/global-error.tsx'),
    tokens,
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Route-state foundation failure: ${error}`);
  process.exit(1);
}
console.log(
  `Route-state foundation contract: PASS (${requiredFiles.length} artifacts, loading, safe recovery, shell preservation, absence, focus, responsive layout, and stories)`,
);
