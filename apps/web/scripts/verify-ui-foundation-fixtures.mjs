import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateUiFoundation } from './ui-foundation-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const valid = {
  primitives: read('src/styles/tokens/primitives.css'),
  semantic: read('src/styles/tokens/semantic.css'),
  themes: read('src/styles/tokens/themes.css'),
  motion: read('src/styles/tokens/motion.css'),
  reset: read('src/styles/reset.css'),
  consumerStyles: read('src/styles/globals.css'),
  storybookMain: read('.storybook/main.ts'),
  storybookPreview: read('.storybook/preview.tsx'),
};

assert.deepEqual(validateUiFoundation(valid), []);

const missingSemantic = validateUiFoundation({
  ...valid,
  semantic: valid.semantic.replace(/\s*--surface-app:[^;]+;/, ''),
});
assert.ok(missingSemantic.includes('semantic.css: missing --surface-app'));

const paletteLeak = validateUiFoundation({
  ...valid,
  consumerStyles: `${valid.consumerStyles}\n.fixture { color: #fff; }\n`,
});
assert.ok(
  paletteLeak.includes(
    'globals.css: contains a raw color outside the token owners',
  ),
);

const missingA11y = validateUiFoundation({
  ...valid,
  storybookMain: valid.storybookMain.replace("'@storybook/addon-a11y'", ''),
});
assert.ok(
  missingA11y.includes("Storybook main: missing '@storybook/addon-a11y'"),
);

console.log('UI foundation negative fixtures: PASS (3 controlled failures)');
