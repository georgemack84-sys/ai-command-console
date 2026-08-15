#!/usr/bin/env node

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const yaml = require('js-yaml');

const repositoryRoot = join(__dirname, '..');
const workflowPath = join(repositoryRoot, '.github', 'workflows', 'ci.yml');
const source = readFileSync(workflowPath, 'utf8');
const workflow = yaml.load(source);

assert.equal(workflow.name, 'CI');
assert.deepEqual(workflow.permissions, { contents: 'read' });
assert.equal(workflow.concurrency['cancel-in-progress'], true);
assert.match(workflow.concurrency.group, /pull_request\.number/);
assert.ok(workflow.on.pull_request !== undefined);
assert.deepEqual(workflow.on.push.branches, ['main']);
assert.ok(workflow.on.workflow_dispatch !== undefined);

const expectedJobs = {
  'repository-validation': 'Repository Validation',
  'frontend-validation': 'Frontend Validation',
  'backend-validation': 'Backend Validation',
  'integration-validation': 'Integration Validation',
  'docker-validation': 'Docker Validation',
  'openapi-validation': 'OpenAPI Validation',
  'health-validation': 'Health Validation',
};
assert.deepEqual(
  Object.fromEntries(
    Object.entries(workflow.jobs).map(([id, job]) => [id, job.name]),
  ),
  expectedJobs,
);

for (const [id, job] of Object.entries(workflow.jobs)) {
  assert.equal(job['runs-on'], 'ubuntu-latest', `${id} must use the supported runner`);
  assert.ok(job['timeout-minutes'] > 0, `${id} must have a positive timeout`);
}

function commands(job) {
  return workflow.jobs[job].steps
    .map((step) => step.run)
    .filter(Boolean)
    .join('\n');
}

assert.match(commands('repository-validation'), /npm run repo -- validate repo/);
assert.match(commands('repository-validation'), /npm run audit:dependencies:root/);
assert.match(commands('repository-validation'), /npm run audit:dependencies:web/);
assert.match(commands('repository-validation'), /npm run audit:dependencies:development/);
assert.match(commands('repository-validation'), /npm run test:dependency-audit-policy/);
assert.match(commands('repository-validation'), /npm run test:release-workflows/);
assert.match(commands('frontend-validation'), /npm run repo -- validate frontend/);
assert.match(commands('frontend-validation'), /npm run repo -- build frontend/);
assert.match(commands('frontend-validation'), /npm run repo -- build storybook/);
assert.match(commands('backend-validation'), /npm run repo -- validate backend/);
assert.match(commands('backend-validation'), /npm run audit:dependencies:dotnet/);
assert.match(commands('backend-validation'), /npm run backend:test:unit/);
assert.equal(workflow.jobs['integration-validation'].needs, 'backend-validation');
assert.match(commands('integration-validation'), /npm run repo -- migrate/);
assert.match(commands('integration-validation'), /npm run backend:test:integration/);
assert.match(commands('docker-validation'), /npm run repo -- validate docker/);
assert.match(commands('openapi-validation'), /npm run repo -- validate openapi/);
assert.match(commands('health-validation'), /npm run repo -- dev/);
assert.match(commands('health-validation'), /npm run repo -- health/);

for (const id of ['integration-validation', 'health-validation']) {
  assert.ok(
    workflow.jobs[id].steps.some(
      (step) => step.if === 'always()' && /down --volumes --remove-orphans/.test(step.run),
    ),
    `${id} must always clean its Compose resources`,
  );
}

assert.doesNotMatch(source, /pull_request_target/);
assert.doesNotMatch(source, /continue-on-error/);
assert.doesNotMatch(source, /\|\|\s*true/);
assert.doesNotMatch(source, /permissions:\s*[\s\S]*?write:/);
assert.doesNotMatch(source, /secrets\./);

console.log('CI workflow contract: PASS (7 stable merge gates)');
