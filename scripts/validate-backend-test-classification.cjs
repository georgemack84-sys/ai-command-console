const assert = require('node:assert/strict');
const { join } = require('node:path');
const {
  readTestProjects,
  validateTestProjects,
} = require('./backend-test-classification-policy.cjs');

const repositoryRoot = join(__dirname, '..');
const projects = readTestProjects(join(repositoryRoot, 'services', 'api'));
const violations = validateTestProjects(projects);

assert.deepEqual(
  violations,
  [],
  `Backend test classification metadata violations:\n${violations.join('\n')}`,
);
console.log('Backend test classification metadata: PASS');
