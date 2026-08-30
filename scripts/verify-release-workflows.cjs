#!/usr/bin/env node

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const yaml = require('js-yaml');

const root = join(__dirname, '..');
const legacySource = readFileSync(join(root, '.github', 'workflows', 'deploy.yml'), 'utf8');
const releaseSource = readFileSync(join(root, '.github', 'workflows', 'release-proprium.yml'), 'utf8');
const legacy = yaml.load(legacySource);
const release = yaml.load(releaseSource);

assert.equal(legacy.name, 'Legacy Deployment (manual only)');
assert.ok(legacy.on.workflow_dispatch !== undefined);
assert.equal(legacy.on.workflow_run, undefined);
assert.doesNotMatch(legacySource, /head_branch == 'main'/);

const legacyCommands = legacy.jobs.package.steps
  .map((step) => step.run ?? '')
  .filter(Boolean)
  .join('\n');
assert.match(legacyCommands, /npm run test:headline-flow/);
assert.doesNotMatch(legacyCommands, /npm run test:release/);

assert.equal(release.name, 'Release Proprium');
assert.deepEqual(Object.keys(release.on), ['workflow_dispatch']);
assert.deepEqual(release.permissions, { contents: 'read', packages: 'write' });
assert.equal(release.concurrency['cancel-in-progress'], false);

const commands = release.jobs.publish.steps
  .map((step) => `${step.run ?? ''}\n${JSON.stringify(step.with ?? {})}`)
  .join('\n');
assert.match(commands, /services\/api\/Proprium\.Api\/Dockerfile/);
assert.match(commands, /apps\/web\/Dockerfile/);
assert.match(commands, /proprium-api:\$\{\{ github\.sha \}\}/);
assert.match(commands, /proprium-web:\$\{\{ github\.sha \}\}/);
assert.match(commands, /NEXT_PUBLIC_API_BASE_URL=\$\{\{ inputs\.public_api_base_url \}\}/);
assert.match(commands, /--migrate/);
assert.doesNotMatch(releaseSource, /pull_request_target/);

console.log('Release workflow contract: PASS (Proprium primary, legacy manual-only)');
