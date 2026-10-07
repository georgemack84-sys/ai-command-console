const test = require('node:test'); const assert = require('node:assert/strict'); const { candidate } = require('./qualification-candidate.cjs');
test('flags unexpected and unknown changes as contamination', () => {
  const report = candidate({ id: 'NURU-CS-0001', expectedPaths: ['src/nuru/**'], requiredCommands: [] }, ['src/nuru/a.ts', 'outside/a.txt']);
  assert.equal(report.expected.length, 1); assert.deepEqual(report.unexpected, ['outside/a.txt']); assert.equal(report.contamination, 2); assert.equal(report.ready, false);
});
