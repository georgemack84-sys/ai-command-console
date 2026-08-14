import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCoreComponents } from './core-component-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'src/ui/components/button.tsx',
  'src/ui/components/forms.tsx',
  'src/ui/components/card.tsx',
  'src/ui/components/feedback.tsx',
  'src/ui/components/components.css',
  'src/ui/components/primitives.stories.tsx',
  'tests/unit/component-contracts.test.tsx',
  'tests/unit/feedback-and-scroll-lock.test.tsx',
  'tests/types/icon-button-contract.tsx',
  'tests/storybook/core-components.spec.ts',
  'docs/component-guide.md',
];
const read = (path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
const missing = requiredFiles.filter((path) => !existsSync(join(root, path)));
const tokens = [
  'src/styles/tokens/primitives.css',
  'src/styles/tokens/semantic.css',
  'src/styles/tokens/themes.css',
  'src/styles/tokens/motion.css',
]
  .map(read)
  .join('\n');
const errors = [
  ...missing.map(
    (path) => `${path}: required core-component artifact is missing`,
  ),
  ...validateCoreComponents({
    button: read('src/ui/components/button.tsx'),
    forms: read('src/ui/components/forms.tsx'),
    card: read('src/ui/components/card.tsx'),
    feedback: read('src/ui/components/feedback.tsx'),
    styles: read('src/ui/components/components.css'),
    stories: read('src/ui/components/primitives.stories.tsx'),
    tokens,
  }),
];

if (errors.length) {
  for (const error of errors) console.error(`Core component failure: ${error}`);
  process.exit(1);
}

console.log(
  `Core component contract: PASS (${requiredFiles.length} artifacts, semantic APIs, token use, motion, and stories)`,
);
