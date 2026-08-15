import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCoreComponents } from './core-component-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const valid = {
  button: read('src/ui/components/button.tsx'),
  forms: read('src/ui/components/forms.tsx'),
  card: read('src/ui/components/card.tsx'),
  feedback: read('src/ui/components/feedback.tsx'),
  styles: read('src/ui/components/components.css'),
  stories: read('src/ui/components/primitives.stories.tsx'),
  tokens: [
    'src/styles/tokens/primitives.css',
    'src/styles/tokens/semantic.css',
    'src/styles/tokens/themes.css',
    'src/styles/tokens/motion.css',
  ]
    .map(read)
    .join('\n'),
};

assert.deepEqual(validateCoreComponents(valid), []);

const submittingDefault = validateCoreComponents({
  ...valid,
  button: valid.button.replace("type = 'button'", "type = 'submit'"),
});
assert.ok(
  submittingDefault.includes(
    'button.tsx: Button must default to non-submitting native behavior',
  ),
);

const unnamedIcon = validateCoreComponents({
  ...valid,
  button: valid.button.replace('label: string', 'label?: string'),
});
assert.ok(
  unnamedIcon.includes(
    'button.tsx: IconButton must require an accessible label',
  ),
);

const applicationImport = validateCoreComponents({
  ...valid,
  card: `${valid.card}\nimport '@/shell/components/application-shell';`,
});
assert.ok(
  applicationImport.includes(
    'card.tsx: reusable UI depends on a prohibited application layer',
  ),
);

const rawColor = validateCoreComponents({
  ...valid,
  styles: `${valid.styles}\n.fixture { color: #fff; }`,
});
assert.ok(
  rawColor.includes(
    'components.css: contains a raw color outside token ownership',
  ),
);

const unresolvedToken = validateCoreComponents({
  ...valid,
  styles: `${valid.styles}\n.fixture { color: var(--missing-semantic); }`,
});
assert.ok(
  unresolvedToken.includes('components.css: unresolved --missing-semantic'),
);

console.log('Core component negative fixtures: PASS (5 controlled failures)');
