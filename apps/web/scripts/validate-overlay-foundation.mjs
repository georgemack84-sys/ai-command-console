import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateOverlayFoundation } from './overlay-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'src/ui/components/overlays.tsx',
  'src/ui/components/overlays.stories.tsx',
  'src/ui/components/components.css',
  'src/app/layout.tsx',
  'src/shell/components/mobile-navigation-drawer.tsx',
  'tests/unit/dialog.test.tsx',
  'tests/unit/alert-dialog.test.tsx',
  'tests/unit/dropdown-menu.test.tsx',
  'tests/storybook/overlays.spec.ts',
  'docs/component-guide.md',
];
const read = (path) =>
  existsSync(join(root, path)) ? readFileSync(join(root, path), 'utf8') : '';
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}
const directPrimitiveConsumers = sourceFiles(join(root, 'src'))
  .filter((path) => !path.endsWith(join('ui', 'components', 'overlays.tsx')))
  .filter((path) =>
    /@radix-ui\/react-(?:dialog|alert-dialog|dropdown-menu)/.test(
      readFileSync(path, 'utf8'),
    ),
  )
  .map((path) => relative(root, path).replaceAll('\\', '/'));
const tokens = ['primitives.css', 'semantic.css', 'themes.css', 'motion.css']
  .map((name) => read(`src/styles/tokens/${name}`))
  .join('\n');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: required overlay artifact is missing`),
  ...validateOverlayFoundation({
    overlays: read('src/ui/components/overlays.tsx'),
    styles: read('src/ui/components/components.css'),
    stories: read('src/ui/components/overlays.stories.tsx'),
    layout: read('src/app/layout.tsx'),
    drawer: read('src/shell/components/mobile-navigation-drawer.tsx'),
    packageManifest: read('package.json'),
    tokens,
    directPrimitiveConsumers,
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Overlay foundation failure: ${error}`);
  process.exit(1);
}
console.log(
  `Overlay foundation contract: PASS (${requiredFiles.length} artifacts, primitive ownership, portals, focus, layers, motion, and stories)`,
);
