module.exports = {
  forbidden: [
    {
      name: 'ui-cannot-depend-on-shell',
      severity: 'error',
      from: {
        path: '^(src/ui|tests/architecture/fixtures/failing/ui-to-shell\\.ts)',
      },
      to: { path: '^src/shell' },
    },
    {
      name: 'ui-cannot-depend-on-app',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/app' },
    },
    {
      name: 'theme-cannot-depend-on-ui-or-shell',
      severity: 'error',
      from: {
        path: '^(src/theme|tests/architecture/fixtures/failing/theme-to-ui\\.ts)',
      },
      to: { path: '^src/(ui|shell)' },
    },
    {
      name: 'state-cannot-depend-on-shell-components',
      severity: 'error',
      from: { path: '^src/state' },
      to: { path: '^src/shell/components' },
    },
    {
      name: 'production-cannot-depend-on-testing',
      severity: 'error',
      from: {
        path: '^(src/(app|ui|shell|theme|providers|state|config)|tests/architecture/fixtures/failing/production-to-testing\\.ts)',
        pathNot: '\\.(test|spec)\\.[tj]sx?$',
      },
      to: { path: '^(src/testing|tests)' },
    },
    {
      name: 'no-private-theme-deep-imports',
      severity: 'error',
      from: {
        path: '^(src/(?!theme/)|tests/architecture/fixtures/failing/private-theme-import\\.ts)',
      },
      to: { path: '^src/theme/(?!index)' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-production-to-test',
      severity: 'error',
      from: { path: '^src/(app|components|config|lib|types)' },
      to: { path: '^src/test' },
    },
    {
      name: 'no-component-to-route',
      severity: 'error',
      from: { path: '^src/components' },
      to: { path: '^src/app' },
    },
    {
      name: 'config-is-a-leaf',
      severity: 'error',
      from: { path: '^src/config', pathNot: '\\.test\\.ts$' },
      to: { path: '^src/', pathNot: '^src/(config|types)' },
    },
    {
      name: 'no-lib-to-route',
      severity: 'error',
      from: { path: '^src/lib' },
      to: { path: '^src/app' },
    },
    {
      name: 'no-lib-to-test',
      severity: 'error',
      from: { path: '^src/lib' },
      to: { path: '^src/test' },
    },
    {
      name: 'types-are-leaf',
      severity: 'error',
      from: { path: '^src/types' },
      to: { path: '^src/(app|components|config|lib|test)' },
    },
    {
      name: 'no-unresolved',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'architecture-fixture-must-not-import-route',
      severity: 'error',
      from: { path: '^src/test/architecture-fixtures' },
      to: { path: '^src/app' },
    },
    {
      name: 'reserved-forbidden-dependencies',
      severity: 'error',
      from: { path: '^src/forbidden/' },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: { dot: { collapsePattern: 'node_modules' } },
  },
};
