const assert = require('node:assert/strict');
const { join } = require('node:path');
const { readProjects, validateProjectGraph } = require('./backend-architecture-policy.cjs');

const repositoryRoot = join(__dirname, '..');
const projects = readProjects(join(repositoryRoot, 'services', 'api'));
const violations = validateProjectGraph(projects);

assert.deepEqual(
  violations,
  [],
  `Backend project architecture violations:\n${violations.join('\n')}`,
);
console.log(`Backend project architecture: PASS (${projects.size} projects)`);
