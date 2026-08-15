#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const result = spawnSync(
  'dotnet',
  [
    'list',
    'services/api/Proprium.sln',
    'package',
    '--vulnerable',
    '--include-transitive',
    '--format',
    'json',
  ],
  { encoding: 'utf8' },
);

if (result.error) {
  console.error(`Unable to start the .NET dependency audit: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (error) {
  console.error(`The .NET dependency audit returned invalid JSON: ${error.message}`);
  process.exit(1);
}

const problems = Array.isArray(report.problems) ? report.problems : [];
const vulnerablePackages = [];

function inspect(value, path = 'report') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value.vulnerabilities) && value.vulnerabilities.length > 0) {
    vulnerablePackages.push({
      path,
      id: value.id ?? value.name ?? 'unknown package',
      resolvedVersion: value.resolvedVersion ?? 'unknown version',
      vulnerabilities: value.vulnerabilities,
    });
  }

  for (const [key, child] of Object.entries(value)) inspect(child, `${path}.${key}`);
}

inspect(report);

if (problems.length > 0 || vulnerablePackages.length > 0) {
  for (const problem of problems) console.error(`Dependency audit problem: ${problem}`);
  for (const entry of vulnerablePackages) {
    console.error(`${entry.id}@${entry.resolvedVersion} is vulnerable (${entry.path})`);
    for (const vulnerability of entry.vulnerabilities) {
      console.error(`  ${vulnerability.severity ?? 'unknown'}: ${vulnerability.advisoryUrl ?? 'no advisory URL'}`);
    }
  }
  process.exit(1);
}

console.log('Backend dependency audit: PASS (no known vulnerable packages)');
