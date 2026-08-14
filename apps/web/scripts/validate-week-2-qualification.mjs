import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateWeek2Qualification } from './week-2-qualification-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = join(root, '..', '..');
const requiredFiles = [
  'tests/storybook/week-2-qualification.spec.ts',
  'docs/week-2-qualification.md',
  'docs/accessibility-evidence.md',
  'docs/accessibility-exceptions.md',
  '../../docs/engineering/gp-24-ui-foundation-qualification.md',
  '../../docs/validation/week-2/gp-24-ui-foundation-qualification.md',
];
const read = (base, path) =>
  existsSync(join(base, path)) ? readFileSync(join(base, path), 'utf8') : '';
const packageJson = read(root, 'package.json');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(root, path)))
    .map((path) => `${path}: required GP-24 artifact is missing`),
  ...validateWeek2Qualification({
    packageJson,
    repositoryCommands: read(repositoryRoot, 'scripts/proprium-command.cjs'),
    browserQualification: read(
      root,
      'tests/storybook/week-2-qualification.spec.ts',
    ),
    qualificationRecord: read(root, 'docs/week-2-qualification.md'),
    accessibilityEvidence: read(root, 'docs/accessibility-evidence.md'),
    accessibilityExceptions: read(root, 'docs/accessibility-exceptions.md'),
    dependencies: packageJson,
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Week 2 qualification failure: ${error}`);
  process.exit(1);
}
console.log(
  `Week 2 qualification contract: PASS (${requiredFiles.length} records, inherited GP-19 through GP-23 gates, responsive, keyboard, cleanup, and truthful attestation policy)`,
);
