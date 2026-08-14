import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateResponsiveShell } from './shell-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'src/shell/components/application-shell.tsx',
  'src/shell/components/application-header.tsx',
  'src/shell/components/desktop-sidebar.tsx',
  'src/shell/components/mobile-navigation-drawer.tsx',
  'src/shell/components/shell-navigation.tsx',
  'src/shell/navigation/navigation-model.ts',
  'src/shell/shell.css',
  'src/shell/components/application-shell.stories.tsx',
  'tests/unit/application-shell.test.tsx',
  'tests/storybook/application-shell.spec.ts',
  'docs/shell-architecture.md',
];
const read = (path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
const componentPaths = requiredFiles.filter(
  (path) => path.startsWith('src/shell/') && path.endsWith('.tsx'),
);
const tokens = [
  'src/styles/tokens/primitives.css',
  'src/styles/tokens/semantic.css',
  'src/styles/tokens/themes.css',
  'src/styles/tokens/motion.css',
]
  .map(read)
  .join('\n');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: required shell artifact is missing`),
  ...validateResponsiveShell({
    application: read('src/shell/components/application-shell.tsx'),
    drawer: read('src/shell/components/mobile-navigation-drawer.tsx'),
    navigation: read('src/shell/components/shell-navigation.tsx'),
    styles: read('src/shell/shell.css'),
    stories: read('src/shell/components/application-shell.stories.tsx'),
    breakpoints: read('src/config/breakpoints.ts'),
    shellSources: componentPaths.map(read).join('\n'),
    tokens,
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Responsive shell failure: ${error}`);
  process.exit(1);
}
console.log(
  `Responsive shell contract: PASS (${requiredFiles.length} artifacts, responsive, navigation, focus, and token boundaries)`,
);
