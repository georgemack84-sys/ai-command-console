module.exports = {
  forbidden: [
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
