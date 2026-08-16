#!/usr/bin/env node

const assert = require('node:assert/strict');
const {
  validateBuildTimeIndependence,
} = require('./build-time-independence-policy.cjs');

function validInput() {
  return {
    program:
      'OpenApiToolingConfiguration.AddSyntheticProvider; AddMetadataServices(); builder.Build(); if (openApiOutput is not null)\n{ Capture(app); ISwaggerProvider; } if (args.Contains("--migrate")) { MigrateAsync(); }',
    configuration: 'Required Integer OriginValidator',
    openApiTooling:
      'postgres.openapi.invalid redis.openapi.invalid synthetic-not-connected',
    infrastructureRegistration:
      'AddDbContext<PropriumDbContext>(); AddSingleton<IConnectionMultiplexer>(provider => deferred);',
    designTimeFactory:
      'IDesignTimeDbContextFactory<PropriumDbContext> postgres.design-time.invalid',
    openApiGenerator: '"--no-build" "--no-restore" --write-openapi',
    commandSource:
      '"build backend" processStep("Build backend", "dotnet", ["build", backendSolution]); "build storybook"',
    productionFiles: [{ file: 'Safe.cs', source: 'sealed class Safe;' }],
    workflow: {
      jobs: {
        'repository-validation': { steps: [] },
        'frontend-validation': { steps: [] },
        'backend-validation': {
          steps: [
            { run: 'dotnet restore services/api/Proprium.sln' },
            { run: 'npm run repo -- validate backend' },
          ],
        },
        'openapi-validation': {
          steps: [
            { run: 'dotnet build services/api/Proprium.Api' },
            { run: 'npm run repo -- validate openapi' },
          ],
        },
        'integration-validation': {
          needs: 'backend-validation',
          steps: [
            { run: 'dotnet build services/api/Proprium.IntegrationTests' },
            { run: 'npm run repo -- migrate' },
          ],
        },
      },
    },
  };
}

assert.deepEqual(validateBuildTimeIndependence(validInput()), []);

const cases = [
  [
    'OpenAPI starts the host',
    (input) => {
      input.program = input.program.replace(
        'Capture(app);',
        'Capture(app); app.StartAsync();',
      );
    },
    /must not activate the host/,
  ],
  [
    'configuration pings Redis',
    (input) => {
      input.configuration += ' PingAsync();';
    },
    /configuration validation must remain structural/,
  ],
  [
    'EF factory uses a live-looking host',
    (input) => {
      input.designTimeFactory = input.designTimeFactory.replace(
        'postgres.design-time.invalid',
        'localhost',
      );
    },
    /non-routable synthetic host/,
  ],
  [
    'OpenAPI script starts Docker',
    (input) => {
      input.openApiGenerator += " 'docker' 'compose' up";
    },
    /must not invoke runtime infrastructure commands/,
  ],
  [
    'production module initializer',
    (input) => {
      input.productionFiles[0].source =
        '[ModuleInitializer] static void Start() {}';
    },
    /module initializers are prohibited/,
  ],
  [
    'backend CI provisions Redis',
    (input) => {
      input.workflow.jobs['backend-validation'].services = { redis: {} };
    },
    /must not provision runtime services/,
  ],
  [
    'integration does not depend on build validation',
    (input) => {
      delete input.workflow.jobs['integration-validation'].needs;
    },
    /must depend on infrastructure-independent backend validation/,
  ],
];

for (const [name, mutate, expected] of cases) {
  const input = validInput();
  mutate(input);
  assert.match(
    validateBuildTimeIndependence(input).join('\n'),
    expected,
    `${name} fixture was accepted`,
  );
}

console.log(
  'Build-time independence controlled failures: PASS (7 rejected fixtures)',
);
