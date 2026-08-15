#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'proprium-openapi-'));
const openApiDocument = join(temporaryDirectory, 'proprium-openapi.json');

function run(name, args) {
  const result = spawnSync(name, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      DOTNET_CLI_HOME: temporaryDirectory,
      DOTNET_GENERATE_ASPNET_CERTIFICATE: 'false',
      DOTNET_CLI_TELEMETRY_OPTOUT: '1',
      DOTNET_NOLOGO: '1',
      DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
      HOME: temporaryDirectory,
      LOCALAPPDATA: temporaryDirectory,
      USERPROFILE: temporaryDirectory,
    },
  });
  if (result.error) {
    console.error(`Required executable "${name}" could not be started: ${result.error.message}`);
    process.exitCode = 1;
    return false;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }
  return true;
}

try {
  if (
    run('dotnet', [
      'run',
      '--project',
      'services/api/Proprium.Api',
      '--configuration',
      'Release',
      '--no-build',
      '--no-restore',
      '--',
      '--write-openapi',
      openApiDocument,
    ])
  ) {
    run(process.execPath, [
      join(repositoryRoot, 'scripts', 'validate-openapi.cjs'),
      openApiDocument,
    ]);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
