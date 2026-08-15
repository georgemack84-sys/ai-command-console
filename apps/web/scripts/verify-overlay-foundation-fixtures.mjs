import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateOverlayFoundation } from './overlay-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const valid = {
  overlays: read('src/ui/components/overlays.tsx'),
  styles: read('src/ui/components/components.css'),
  stories: read('src/ui/components/overlays.stories.tsx'),
  layout: read('src/app/layout.tsx'),
  drawer: read('src/shell/components/mobile-navigation-drawer.tsx'),
  packageManifest: read('package.json'),
  tokens: ['primitives.css', 'semantic.css', 'themes.css', 'motion.css']
    .map((name) => read(`src/styles/tokens/${name}`))
    .join('\n'),
  directPrimitiveConsumers: [],
};

assert.deepEqual(validateOverlayFoundation(valid), []);
assert.ok(
  validateOverlayFoundation({
    ...valid,
    directPrimitiveConsumers: ['src/components/fake-dialog.tsx'],
  }).some((error) => error.includes('direct Radix imports')),
);
assert.ok(
  validateOverlayFoundation({
    ...valid,
    overlays: `${valid.overlays}\nsetTimeout(() => trigger.focus(), 20);`,
  }).some((error) => error.includes('arbitrary focus')),
);
assert.ok(
  validateOverlayFoundation({
    ...valid,
    styles: `${valid.styles}\n.fixture { color: #fff; }`,
  }).some((error) => error.includes('raw color')),
);
assert.ok(
  validateOverlayFoundation({
    ...valid,
    stories: valid.stories.replace(
      'export const DialogBasic',
      'const DialogBasic',
    ),
  }).some((error) => error.includes('DialogBasic story')),
);
assert.ok(
  validateOverlayFoundation({
    ...valid,
    overlays: valid.overlays.replaceAll('collisionPadding', 'edgePadding'),
  }).some((error) => error.includes('collisionPadding')),
);
console.log(
  'Overlay foundation negative fixtures: PASS (5 controlled failures)',
);
