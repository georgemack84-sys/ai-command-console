#!/usr/bin/env node

const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const failures = [];
const evidenceRoot = 'docs/validation/day-5';
const required = {
  'clean-installation.md': [
    'CLEAN INSTALLATION: PASS WITH DOCUMENTED PLATFORM LIMITATIONS',
    '7153f163539ddcf8790d293f9e385c1585fb4e48',
    '../gp-16-clean-machine.md',
  ],
  'ci-validation.md': [
    'CI VALIDATION: PASS',
    '31769426663',
    'Repository Validation',
    'Frontend Validation',
    'Backend Validation',
    'Integration Validation',
    'Docker Validation',
    'OpenAPI Validation',
    'Health Validation',
  ],
  'developer-onboarding.md': [
    'DEVELOPER ONBOARDING: PASS',
    '../../onboarding/developer-setup.md',
    '../../operations/troubleshooting.md',
  ],
  'repository-validation.md': [
    'REPOSITORY VALIDATION: PASS',
    'npm run repo -- validate repo',
    'Controlled failure evidence',
  ],
  'qualification.md': [
    'DAY 5 QUALIFICATION: QUALIFIED',
    'GP-17 STATUS: COMPLETE — DAY 5 QUALIFIED',
    'Week 2 handoff',
    'Safe to begin Week 2: YES',
  ],
};

function read(relative) {
  const absolute = join(root, relative);
  if (!existsSync(absolute)) {
    failures.push(`${relative}: required evidence file is missing`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

for (const [name, expectedValues] of Object.entries(required)) {
  const relative = `${evidenceRoot}/${name}`;
  const source = read(relative);
  for (const expected of expectedValues) {
    if (!source.includes(expected)) {
      failures.push(`${relative}: missing ${JSON.stringify(expected)}`);
    }
  }
}

const qualification = read(`${evidenceRoot}/qualification.md`);
for (const domain of [
  'Configuration', 'Repository', 'Frontend', 'Backend', 'Architecture',
  'Integration', 'Docker', 'OpenAPI', 'Health', 'Commands', 'Windows Parity',
  'CI', 'Documentation', 'Clean Installation', 'Onboarding', 'Security',
]) {
  const row = new RegExp(`\\| ${domain} \\| PASS \\|`);
  if (!row.test(qualification)) failures.push(`${evidenceRoot}/qualification.md: ${domain} is not PASS`);
}

for (const marker of ['TBD', 'TO BE DETERMINED', 'STATUS: PENDING']) {
  if (qualification.includes(marker)) {
    failures.push(`${evidenceRoot}/qualification.md: unresolved marker ${JSON.stringify(marker)}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`Day 5 qualification failure: ${failure}`);
  process.exit(1);
}

console.log(`Day 5 qualification evidence: PASS (${Object.keys(required).length} records, 16 domains)`);
