const assert = require('node:assert/strict');
const { test } = require('node:test');
const { classifyPath, validateOwnership } = require('./project-ownership-policy.cjs');

test('classifies Nuru, platform, generated, temporary, and unknown paths', () => {
  assert.equal(classifyPath('src/nuru/vault-contracts.ts'), 'NURU');
  assert.equal(classifyPath('src/server/services/nuru-vault-review-service.ts'), 'NURU');
  assert.equal(classifyPath('services/api/Proprium.sln'), 'PROPRIUM_API');
  assert.equal(classifyPath('apps/web/package.json'), 'PROPRIUM_WEB');
  assert.equal(classifyPath('.next-production/BUILD_ID'), 'GENERATED');
  assert.equal(classifyPath('.codex-worktrees/day4-login/trace.log'), 'TEMPORARY');
  assert.equal(classifyPath('unclassified/file.txt'), 'UNKNOWN');
});

test('validates the repository ownership contract', () => {
  assert.deepEqual(validateOwnership(), []);
});
