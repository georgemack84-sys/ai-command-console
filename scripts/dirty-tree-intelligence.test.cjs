const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePorcelain, summarize } = require('./dirty-tree-intelligence.cjs');

test('separates source, generated, temporary, and unknown dirty entries', () => {
  const report = summarize(parsePorcelain(' M src/nuru/example.ts\n?? .next-production/BUILD_ID\n?? .codex-temp/trace.log\n?? outside/file.txt\n'));
  assert.equal(report.total, 4);
  assert.equal(report.groups.get('NURU').length, 1);
  assert.equal(report.groups.get('GENERATED').length, 1);
  assert.equal(report.groups.get('TEMPORARY').length, 1);
  assert.equal(report.unknown, 1);
  assert.equal(report.risk, 'WARN');
});
