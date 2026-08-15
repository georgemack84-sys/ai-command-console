import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateUiFoundation } from './ui-foundation-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  '.storybook/main.ts',
  '.storybook/preview.tsx',
  'docs/adr/ADR-008-ui-architecture.md',
  'docs/adr/ADR-009-design-tokens.md',
  'docs/adr/ADR-010-theme-preference.md',
  'docs/adr/ADR-011-prehydration-theme-bootstrap.md',
  'docs/adr/ADR-012-storybook-parity.md',
  'docs/component-guide.md',
  'docs/week-2-validation.md',
  'src/config/breakpoints.ts',
  'src/styles/tokens/primitives.css',
  'src/styles/tokens/semantic.css',
  'src/styles/tokens/themes.css',
  'src/styles/tokens/motion.css',
  'src/styles/reset.css',
  'src/ui/foundations/token-specimen.stories.tsx',
  'src/ui/foundations/responsive-specimen.stories.tsx',
  'src/ui/foundations/theme-provider-smoke.stories.tsx',
];

const missing = requiredFiles.filter((path) => !existsSync(join(root, path)));
const read = (path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
const errors = [
  ...missing.map(
    (path) => `${path}: required UI foundation artifact is missing`,
  ),
  ...validateUiFoundation({
    primitives: read('src/styles/tokens/primitives.css'),
    semantic: read('src/styles/tokens/semantic.css'),
    themes: read('src/styles/tokens/themes.css'),
    motion: read('src/styles/tokens/motion.css'),
    reset: read('src/styles/reset.css'),
    consumerStyles: read('src/styles/globals.css'),
    storybookMain: read('.storybook/main.ts'),
    storybookPreview: read('.storybook/preview.tsx'),
  }),
];

if (errors.length > 0) {
  for (const error of errors) console.error(`UI foundation failure: ${error}`);
  process.exit(1);
}

console.log(
  `UI foundation contract: PASS (${requiredFiles.length} artifacts, semantic tokens, themes, and Storybook parity)`,
);
