#!/usr/bin/env node

const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join, relative } = require('node:path');
const yaml = require('js-yaml');
const {
  validateBuildTimeIndependence,
} = require('./build-time-independence-policy.cjs');

const repositoryRoot = join(__dirname, '..');
const read = (path) => readFileSync(join(repositoryRoot, path), 'utf8');

function readProductionFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'bin' || entry.name === 'obj') continue;
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...readProductionFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.cs')) {
      files.push({
        file: relative(repositoryRoot, path).replaceAll('\\', '/'),
        source: readFileSync(path, 'utf8'),
      });
    }
  }
  return files;
}

const errors = validateBuildTimeIndependence({
  program: read('services/api/Proprium.Api/Program.cs'),
  configuration: read(
    'services/api/Proprium.Api/Configuration/ApiConfiguration.cs',
  ),
  openApiTooling: read(
    'services/api/Proprium.Api/Configuration/OpenApiToolingConfiguration.cs',
  ),
  infrastructureRegistration: read(
    'services/api/Proprium.Infrastructure/ServiceCollectionExtensions.cs',
  ),
  designTimeFactory: read(
    'services/api/Proprium.Infrastructure/Persistence/PropriumDbContextFactory.cs',
  ),
  openApiGenerator: read('scripts/validate-openapi-generation.cjs'),
  commandSource: read('scripts/proprium-command.cjs'),
  productionFiles: readProductionFiles(
    join(repositoryRoot, 'services', 'api'),
  ).filter(
    ({ file }) => !/Proprium\.(?:Architecture|Integration)Tests\//.test(file),
  ),
  workflow: yaml.load(read('.github/workflows/ci.yml')),
});

assert.deepEqual(
  errors,
  [],
  `Build-time infrastructure independence violations:\n${errors.join('\n')}`,
);
console.log(
  'Build-time infrastructure independence: PASS (composition, EF tooling, OpenAPI, commands, and CI)',
);
