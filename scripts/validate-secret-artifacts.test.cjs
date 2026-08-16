const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { scanArtifact } = require('./validate-secret-artifacts.cjs');

function withArtifact(content, action) {
  const directory = mkdtempSync(join(tmpdir(), 'proprium-secret-artifact-'));
  try {
    writeFileSync(join(directory, 'artifact.js'), content);
    action(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('accepts public frontend configuration', () => {
  withArtifact('https://api.frontend.example', (directory) => {
    assert.deepEqual(scanArtifact(directory, ['server-only-fixture']), []);
  });
});

test('rejects server-only sentinels without returning the value', () => {
  const sentinel = ['gp35-', 'server-only-', 'fixture'].join('');
  withArtifact(`window.__fixture = ${JSON.stringify(sentinel)};`, (directory) => {
    const findings = scanArtifact(directory, [sentinel]);
    assert.equal(findings[0].code, 'secret-sentinel');
    assert.doesNotMatch(JSON.stringify(findings), new RegExp(sentinel));
  });
});

test('rejects provider signatures in generated artifacts', () => {
  const token = ['github', '_pat_', 'A'.repeat(32)].join('');
  withArtifact(token, (directory) => {
    assert.equal(scanArtifact(directory)[0].code, 'provider-token');
  });
});
