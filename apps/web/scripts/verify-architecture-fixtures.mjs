import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const cases = [
  [
    'ui-cannot-depend-on-shell',
    'tests/architecture/fixtures/failing/ui-to-shell.ts',
  ],
  [
    'theme-cannot-depend-on-ui-or-shell',
    'tests/architecture/fixtures/failing/theme-to-ui.ts',
  ],
  [
    'production-cannot-depend-on-testing',
    'tests/architecture/fixtures/failing/production-to-testing.ts',
  ],
  [
    'no-private-theme-deep-imports',
    'tests/architecture/fixtures/failing/private-theme-import.ts',
  ],
  ['no-circular', 'tests/architecture/fixtures/failing/circular-a.ts'],
];

for (const [rule, fixture] of cases) {
  const result = spawnSync(
    process.execPath,
    [
      resolve('node_modules/dependency-cruiser/bin/dependency-cruise.mjs'),
      '--config',
      '.dependency-cruiser.cjs',
      '--output-type',
      'err',
      fixture,
    ],
    { encoding: 'utf8' },
  );
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 0 || !output.includes(rule)) {
    console.error(`Expected ${fixture} to violate ${rule}.\n${output}`);
    process.exit(1);
  }
}
console.log(
  'Expected architecture violations were detected by their named rules.',
);
