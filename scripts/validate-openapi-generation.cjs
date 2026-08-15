#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { scanArtifact } = require('./validate-secret-artifacts.cjs');

const repositoryRoot = join(__dirname, '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'proprium-openapi-'));
const openApiDocument = join(temporaryDirectory, 'proprium-openapi.json');

function run(name, args, prohibitedOutput, workingDirectory = repositoryRoot) {
  const result = spawnSync(name, args, {
    cwd: workingDirectory,
    stdio: prohibitedOutput ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: {
      ...process.env,
      APPDATA: temporaryDirectory,
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
    console.error(
      `Required executable "${name}" could not be started: ${result.error.message}`,
    );
    process.exitCode = 1;
    return false;
  }
  if (prohibitedOutput) {
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (
      prohibitedOutput.test(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
    ) {
      console.error(
        'OpenAPI generation activated a runtime listener or infrastructure operation.',
      );
      process.exitCode = 1;
      return false;
    }
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }
  return true;
}

try {
  if (
    run(
      'dotnet',
      [
        'run',
        '--project',
        join(repositoryRoot, 'services', 'api', 'Proprium.Api'),
        '--configuration',
        'Release',
        '--no-build',
        '--no-restore',
        '--',
        '--write-openapi',
        openApiDocument,
      ],
      /Now listening on:|Application started|PostgreSQL is unavailable|Redis is unavailable|Applying migration/i,
      temporaryDirectory,
    )
  ) {
    const findings = scanArtifact(openApiDocument, [
      'synthetic-not-connected',
      'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
    ]);
    if (findings.length) {
      for (const finding of findings) {
        console.error(`${finding.path}:${finding.line} [${finding.code}] ${finding.message}`);
      }
      console.error(`OpenAPI secret artifact scan: FAIL (${findings.length} finding${findings.length === 1 ? '' : 's'}; candidate values suppressed)`);
      process.exitCode = 1;
    } else {
      console.log('OpenAPI secret artifact scan: PASS');
    }
    run(process.execPath, [
      join(repositoryRoot, 'scripts', 'validate-openapi.cjs'),
      openApiDocument,
    ]);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
