import { runDependencyCruiser } from './run-dependency-cruiser.mjs';

const cases = [
  [
    'no-shared-ui-to-higher-layers',
    'tests/architecture/fixtures/failing/ui-to-shell.ts',
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

for (const [rule, fixture] of cases) {
  const result = runDependencyCruiser(
    ['--config', '.dependency-cruiser.cjs', '--output-type', 'err', fixture],
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
