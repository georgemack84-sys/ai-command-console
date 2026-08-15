const test = require('node:test');
const assert = require('node:assert/strict');
const { scanImageMetadata } = require('./validate-docker-images.cjs');

test('accepts runtime-only public image metadata', () => {
  const inspection = JSON.stringify([{ Config: { Env: ['NODE_ENV=production', 'PORT=3000'] } }]);
  assert.deepEqual(scanImageMetadata('fixture:latest', inspection, 'ENV NODE_ENV=production'), []);
});

test('rejects secret-shaped final image environment entries', () => {
  const inspection = JSON.stringify([{ Config: { Env: [['DATABASE_', 'PASSWORD=value'].join('')] } }]);
  const findings = scanImageMetadata('fixture:latest', inspection, '');
  assert.equal(findings[0].code, 'docker-image-secret-env');
  assert.doesNotMatch(JSON.stringify(findings), /value/);
});
