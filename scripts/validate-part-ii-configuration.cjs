#!/usr/bin/env node

const { readFileSync, readdirSync } = require('node:fs');
const yaml = require('js-yaml');
const { commands } = require('./proprium-command.cjs');

const failures = [];
const workflow = yaml.load(readFileSync('.github/workflows/ci.yml', 'utf8'));
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

function requireCondition(condition, requirement) {
  if (!condition) failures.push(requirement);
}

function commandsFor(job) {
  return (workflow.jobs?.[job]?.steps ?? [])
    .map((step) => step.run)
    .filter(Boolean)
    .join('\n');
}

requireCondition(commands.has('validate configuration'), 'canonical command repo -- validate configuration is missing');
for (const script of [
  'validate:configuration-contract',
  'validate:configuration-architecture',
  'validate:secrets',
  'test:secret-safety',
  'validate:build-time-independence',
  'validate:configuration-documentation',
]) {
  requireCondition(Boolean(packageJson.scripts?.[script]), `package script ${script} is missing`);
}

const repositoryCommands = commandsFor('repository-validation');
requireCondition(repositoryCommands.includes('repo -- validate configuration'), 'repository CI does not run the Part II configuration gate');
requireCondition(
  repositoryCommands.indexOf('repo -- validate configuration') < repositoryCommands.indexOf('repo -- validate repo'),
  'Part II configuration qualification must run before broader repository validation',
);
const frontendCommands = commandsFor('frontend-validation');
for (const expected of ['repo -- validate frontend', 'repo -- build frontend', 'test:secret-isolation', 'test:config-build-failure']) {
  requireCondition(frontendCommands.includes(expected), `frontend CI is missing configuration evidence: ${expected}`);
}
const backendCommands = commandsFor('backend-validation');
for (const expected of ['repo -- validate backend', 'backend:test:unit']) {
  requireCondition(backendCommands.includes(expected), `backend CI is missing configuration evidence: ${expected}`);
}
requireCondition(commandsFor('openapi-validation').includes('repo -- validate openapi'), 'OpenAPI CI secret/metadata qualification is missing');
requireCondition(commandsFor('docker-validation').includes('repo -- validate docker'), 'Docker configuration/image qualification is missing');

for (let gp = 27; gp <= 35; gp += 1) {
  const prefix = `gp-${gp}-`;
  for (const directory of ['docs/engineering', 'docs/validation/week-3']) {
    const present = readdirSync(directory).some((name) => name.startsWith(prefix));
    requireCondition(present, `${directory} is missing GP-${gp} evidence`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`[CONFIG-PART-II] ${failure}`);
  process.exit(1);
}

console.log('Part II matrix: PASS (GP-27 through GP-35 controls, documentation synchronization, and CI ownership)');
console.log('PART II — QUALIFIED');
