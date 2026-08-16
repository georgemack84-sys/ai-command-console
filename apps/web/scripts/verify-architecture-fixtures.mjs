import assert from 'node:assert/strict';

import { runDependencyCruiser } from './run-dependency-cruiser.mjs';

const cases = [
  [
    'no-shared-ui-to-higher-layers',
    'tests/architecture/fixtures/failing/ui-to-shell.ts',
  ],
  [
    'no-shared-ui-to-higher-layers',
    'tests/architecture/fixtures/failing/ui-to-shell-relative.ts',
  ],
  [
    'no-shared-ui-to-higher-layers',
    'tests/architecture/fixtures/failing/ui-to-shell-dynamic.ts',
  ],
  [
    'no-theme-to-higher-layers',
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
  [
    'no-lower-layer-to-app',
    'tests/architecture/fixtures/failing/component-to-route.ts',
  ],
  [
    'no-shared-ui-to-higher-layers',
    'tests/architecture/fixtures/failing/shared-ui-to-component.ts',
  ],
  [
    'no-components-to-shell-or-providers',
    'tests/architecture/fixtures/failing/component-to-provider.ts',
  ],
  [
    'no-lib-to-presentation-or-composition',
    'tests/architecture/fixtures/failing/lib-to-ui.ts',
  ],
  [
    'no-providers-to-routes-shell-or-components',
    'tests/architecture/fixtures/failing/provider-to-component.ts',
  ],
  [
    'no-shell-to-routes-or-providers',
    'tests/architecture/fixtures/failing/shell-to-provider.ts',
  ],
  ['config-is-a-leaf', 'tests/architecture/fixtures/failing/config-to-lib.ts'],
  [
    'production-cannot-depend-on-stories-or-tooling',
    'tests/architecture/fixtures/failing/production-to-story.ts',
  ],
  [
    'no-unresolved-dependencies',
    'tests/architecture/fixtures/failing/unresolved.ts',
  ],
  [
    'no-circular-dependencies',
    'tests/architecture/fixtures/failing/circular-a.ts',
  ],
];

const result = runDependencyCruiser(
  [
    '--config',
    '.dependency-cruiser.cjs',
    '--output-type',
    'json',
    'tests/architecture/fixtures/failing',
  ],
  { encoding: 'utf8' },
);
const output = `${result.stdout}\n${result.stderr}`;
assert.equal(result.status, 0, output);

const report = JSON.parse(result.stdout);
const violations = report.summary?.violations ?? [];
for (const [rule, fixture] of cases) {
  assert.equal(
    violations.some(
      (violation) =>
        violation.from === fixture && violation.rule?.name === rule,
    ),
    true,
    `Expected ${fixture} to violate ${rule}.\n${output}`,
  );
}
console.log(
  'Expected architecture violations were detected by their named rules.',
);
