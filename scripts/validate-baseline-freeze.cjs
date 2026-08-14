#!/usr/bin/env node

const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const failures = [];
const baseline = 'd6a25c87423d69877965d7cb1541b726c7ad3b5d';

const requiredFiles = [
  '.github/pull_request_template.md',
  '.github/workflows/ci.yml',
  'docs/engineering/gp-18-baseline-freeze.md',
  'docs/validation/day-5/qualification.md',
  'docs/validation/day-5/week-2-admission.md',
  'scripts/proprium-command.cjs',
  'scripts/proprium.ps1',
  'scripts/validate-day-5-qualification.cjs',
  'scripts/verify-ci-workflow.cjs',
];

function read(relative) {
  const absolute = join(root, relative);
  if (!existsSync(absolute)) {
    failures.push(`${relative}: protected baseline artifact is missing`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

for (const path of requiredFiles) read(path);

const qualification = read('docs/validation/day-5/qualification.md');
for (const expected of [
  'DAY 5 QUALIFICATION: QUALIFIED',
  'GP-17 STATUS: COMPLETE — DAY 5 QUALIFIED',
  'Safe to begin Week 2: YES',
]) {
  if (!qualification.includes(expected)) {
    failures.push(`docs/validation/day-5/qualification.md: missing ${JSON.stringify(expected)}`);
  }
}

const admission = read('docs/validation/day-5/week-2-admission.md');
for (const expected of [
  baseline,
  'WEEK 2 ADMISSION: ADMITTED',
  'GP-18 STATUS: COMPLETE — BASELINE FROZEN — WEEK 2 ADMITTED',
  'NON_FOUNDATION',
  'FOUNDATION_COMPATIBLE',
  'FOUNDATION_AMENDMENT',
  'FOUNDATION_BREAKING',
  'Deviations: None.',
]) {
  if (!admission.includes(expected)) {
    failures.push(`docs/validation/day-5/week-2-admission.md: missing ${JSON.stringify(expected)}`);
  }
}

for (const gate of [
  'Repository Validation',
  'Frontend Validation',
  'Backend Validation',
  'Integration Validation',
  'Docker Validation',
  'OpenAPI Validation',
  'Health Validation',
]) {
  if (!admission.includes(`| ${gate} |`)) {
    failures.push(`docs/validation/day-5/week-2-admission.md: missing required gate ${JSON.stringify(gate)}`);
  }
}

for (const area of [
  'Configuration',
  'Repository standards',
  'Frontend',
  'Backend and architecture',
  'Commands',
  'CI',
  'Migrations',
  'OpenAPI',
  'Health',
  'Documentation/evidence',
]) {
  if (!admission.includes(`| ${area} |`)) {
    failures.push(`docs/validation/day-5/week-2-admission.md: missing protected area ${JSON.stringify(area)}`);
  }
}

const pullRequestTemplate = read('.github/pull_request_template.md');
for (const classification of [
  'NON_FOUNDATION',
  'FOUNDATION_COMPATIBLE',
  'FOUNDATION_AMENDMENT',
  'FOUNDATION_BREAKING',
]) {
  if (!pullRequestTemplate.includes(classification)) {
    failures.push(`.github/pull_request_template.md: missing foundation classification ${classification}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`Baseline freeze failure: ${failure}`);
  process.exit(1);
}

console.log(`Baseline freeze contract: PASS (${requiredFiles.length} protected artifacts, 7 CI gates, 10 contract areas)`);
