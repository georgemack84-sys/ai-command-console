const productionLayers =
  '^src/(app|components|config|lib|providers|shell|state|theme|types|ui)';
const developmentModule = '\\.(?:test|spec|stories)\\.[tj]sx?$';

module.exports = {
  forbidden: [
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-unresolved-dependencies',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-lower-layer-to-app',
      severity: 'error',
      from: {
        path: '^(src/(components|config|lib|providers|shell|state|theme|types|ui)|tests/architecture/fixtures/failing/component-to-route\\.ts)',
      },
      to: { path: '^src/app' },
    },
    {
      name: 'no-shared-ui-to-higher-layers',
      severity: 'error',
      from: {
        path: '^(src/ui|tests/architecture/fixtures/failing/(ui-to-shell|shared-ui-to-component)\\.ts)',
        pathNot: '\\.stories\\.[tj]sx?$',
      },
      to: {
        path: '^src/(app|components|config|lib|providers|shell|state|test|testing)',
      },
    },
    {
      name: 'no-theme-to-higher-layers',
      severity: 'error',
      from: {
        path: '^(src/theme|tests/architecture/fixtures/failing/theme-to-ui\\.ts)',
      },
      to: {
        path: '^src/(app|components|config|lib|providers|shell|state|test|testing|ui)',
      },
    },
    {
      name: 'no-components-to-shell-or-providers',
      severity: 'error',
      from: {
        path: '^(src/components|tests/architecture/fixtures/failing/component-to-provider\\.ts)',
      },
      to: { path: '^src/(providers|shell)' },
    },
    {
      name: 'no-lib-to-presentation-or-composition',
      severity: 'error',
      from: {
        path: '^(src/lib|tests/architecture/fixtures/failing/lib-to-ui\\.ts)',
      },
      to: { path: '^src/(app|components|providers|shell|test|testing|ui)' },
    },
    {
      name: 'no-providers-to-routes-shell-or-components',
      severity: 'error',
      from: {
        path: '^(src/providers|tests/architecture/fixtures/failing/provider-to-component\\.ts)',
      },
      to: { path: '^src/(app|components|shell)' },
    },
    {
      name: 'no-shell-to-routes-or-providers',
      severity: 'error',
      from: {
        path: '^(src/shell|tests/architecture/fixtures/failing/shell-to-provider\\.ts)',
      },
      to: { path: '^src/(app|providers)' },
    },
    {
      name: 'config-is-a-leaf',
      severity: 'error',
      from: {
        path: '^(src/config|tests/architecture/fixtures/failing/config-to-lib\\.ts)',
        pathNot: '\\.test\\.[tj]sx?$',
      },
      to: { path: '^src/', pathNot: '^src/(config|types)' },
    },
    {
      name: 'no-browser-layer-to-server-config',
      severity: 'error',
      from: { path: '^src/(components|providers|shell|ui)' },
      to: { path: '^src/config/server(?:/|\\.)' },
    },
    {
      name: 'state-and-types-are-leaves',
      severity: 'error',
      from: { path: '^src/(state|types)' },
      to: {
        path: '^src/(app|components|config|lib|providers|shell|test|testing|theme|ui)',
      },
    },
    {
      name: 'production-cannot-depend-on-testing',
      severity: 'error',
      from: {
        path: `^(${productionLayers.slice(1)}|tests/architecture/fixtures/failing/production-to-testing\\.ts)`,
        pathNot: developmentModule,
      },
      to: { path: '^(src/(test|testing)|tests)' },
    },
    {
      name: 'production-cannot-depend-on-stories-or-tooling',
      severity: 'error',
      from: {
        path: `^(${productionLayers.slice(1)}|tests/architecture/fixtures/failing/production-to-story\\.ts)`,
        pathNot: developmentModule,
      },
      to: {
        path: '(^|/)(scripts|tests|\\.storybook)(/|$)|\\.stories\\.[tj]sx?$',
      },
    },
    {
      name: 'no-private-theme-deep-imports',
      severity: 'error',
      from: {
        path: '^(src/(?!theme/)|tests/architecture/fixtures/failing/private-theme-import\\.ts)',
      },
      to: { path: '^src/theme/(?!index\\.)' },
    },
    {
      name: 'no-external-feature-deep-imports',
      severity: 'error',
      from: { path: '^src/(?!features/)' },
      to: { path: '^src/features/[^/]+/(?!index\\.[tj]sx?$)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    reporterOptions: { dot: { collapsePattern: 'node_modules' } },
  },
};
