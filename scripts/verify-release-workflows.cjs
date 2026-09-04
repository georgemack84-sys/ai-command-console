#!/usr/bin/env node

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const yaml = require('js-yaml');

const root = join(__dirname, '..');
const legacySource = readFileSync(join(root, '.github', 'workflows', 'deploy.yml'), 'utf8');
const releaseSource = readFileSync(join(root, '.github', 'workflows', 'release-proprium.yml'), 'utf8');
const stagingDeploySource = readFileSync(join(root, '.github', 'workflows', 'deploy-proprium-staging.yml'), 'utf8');
const legacy = yaml.load(legacySource);
const release = yaml.load(releaseSource);
const stagingDeploy = yaml.load(stagingDeploySource);

assert.equal(legacy.name, 'Legacy Deployment (manual only)');
assert.ok(legacy.on.workflow_dispatch !== undefined);
assert.equal(legacy.on.workflow_run, undefined);
assert.doesNotMatch(legacySource, /head_branch == 'main'/);

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

assert.equal(stagingDeploy.name, 'Deploy Proprium Staging');
assert.deepEqual(Object.keys(stagingDeploy.on), ['workflow_dispatch']);
assert.equal(stagingDeploy.jobs.rollout.environment, 'staging');
assert.equal(stagingDeploy.concurrency['cancel-in-progress'], false);
assert.match(stagingDeploySource, /release_sha/);
assert.match(stagingDeploySource, /database-migrations/);
assert.match(stagingDeploySource, /compose run --rm --no-deps database-migrations/);
assert.match(stagingDeploySource, /platform-api/);
assert.match(stagingDeploySource, /web/);
assert.match(stagingDeploySource, /current-release\.env/);
assert.match(stagingDeploySource, /DEPLOY_SSH_KEY/);
assert.doesNotMatch(stagingDeploySource, /pull_request_target/);

console.log('Release workflow contract: PASS (Proprium release, staging rollout, legacy manual-only)');
