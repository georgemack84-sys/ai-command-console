const test = require('node:test');
const assert = require('node:assert/strict');
const { loadChangeSets, validateChangeSets } = require('./change-set-policy.cjs');

test('validates the versioned Nuru change-set registry', () => {
  assert.deepEqual(validateChangeSets(), []);
  const { records } = loadChangeSets();
  assert.equal(records[0].value.id, 'NURU-CS-0019');
});

test('rejects records missing pre-commit traceability', () => {
  const { index, records } = loadChangeSets();
  const invalid = structuredClone(records);
  invalid[0].value.expectedPaths = [];
  assert.match(validateChangeSets({ index, records: invalid }).join('\n'), /expectedPaths/);
});
