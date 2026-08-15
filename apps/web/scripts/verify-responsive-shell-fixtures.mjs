import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateResponsiveShell } from './shell-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const valid = {
  application: read('src/shell/components/application-shell.tsx'),
  drawer: read('src/shell/components/mobile-navigation-drawer.tsx'),
  navigation: read('src/shell/components/shell-navigation.tsx'),
  styles: read('src/shell/shell.css'),
  stories: read('src/shell/components/application-shell.stories.tsx'),
  breakpoints: read('src/config/breakpoints.ts'),
  shellSources: [
    'application-shell.tsx',
    'application-header.tsx',
    'desktop-sidebar.tsx',
    'mobile-navigation-drawer.tsx',
    'shell-navigation.tsx',
  ]
    .map((name) => read(`src/shell/components/${name}`))
    .join('\n'),
  tokens: ['primitives.css', 'semantic.css', 'themes.css', 'motion.css']
    .map((name) => read(`src/styles/tokens/${name}`))
    .join('\n'),
};

assert.deepEqual(validateResponsiveShell(valid), []);
assert.ok(
  validateResponsiveShell({
    ...valid,
    shellSources: `${valid.shellSources}\nimport '@/components/auth/user-menu';`,
  }).includes('shell: depends on a prohibited application or feature layer'),
);
assert.ok(
  validateResponsiveShell({
    ...valid,
    navigation: valid.navigation.replace(
      "aria-current={current ? 'page' : undefined}",
      'aria-current={undefined}',
    ),
  }).some((error) => error.includes('aria-current')),
);
assert.ok(
  validateResponsiveShell({
    ...valid,
    drawer: valid.drawer.replace('onCloseAutoFocus', 'onDismissAutoFocus'),
  }).some((error) => error.includes('onCloseAutoFocus')),
);
assert.ok(
  validateResponsiveShell({
    ...valid,
    styles: `${valid.styles}\n.fixture { color: #fff; }`,
  }).some((error) => error.includes('raw color')),
);
assert.ok(
  validateResponsiveShell({
    ...valid,
    breakpoints: valid.breakpoints.replace('large: 1024', 'large: 1000'),
  }).some((error) => error.includes('1024px')),
);
console.log('Responsive shell negative fixtures: PASS (5 controlled failures)');
