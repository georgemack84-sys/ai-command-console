const test = require('node:test');
const assert = require('node:assert/strict');
const { isApprovedExample, scanPath, scanText } = require('./validate-secrets.cjs');

test('accepts obvious non-production secret examples', () => {
  assert.equal(isApprovedExample('services/api/.env.example', 'POSTGRES_PASSWORD', 'local-development-only'), true);
  assert.equal(isApprovedExample('services/api/.env.example', 'REDIS_PASSWORD', ''), true);
});

test('rejects unsafe template literals without returning the value', () => {
  const sensitive = 'plausibleCredentialValue';
  const findings = scanText('services/api/.env.example', `POSTGRES_PASSWORD=${sensitive}\n`);
  assert.equal(findings[0].code, 'unsafe-literal');
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(sensitive));
});

test('rejects public secret-like names', () => {
  const publicSecretName = ['NEXT_PUBLIC_DATABASE_', 'PASSWORD'].join('');
  const findings = scanText('apps/web/.env.example', `${publicSecretName}=replace-me\n`);
  assert.equal(findings[0].code, 'public-secret-name');
});

test('rejects private key material assembled as a fixture', () => {
  const marker = ['-----BEGIN ', 'PRIVATE KEY-----'].join('');
  const findings = scanText('fixtures/unexpected.txt', `${marker}\nfixture\n`);
  assert.equal(findings[0].code, 'private-key');
});

test('rejects recognizable provider tokens assembled as fixtures', () => {
  const token = 'ghp_' + 'A'.repeat(40);
  const findings = scanText('fixtures/unexpected.txt', token);
  assert.equal(findings[0].code, 'provider-token');
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(token));
});

test('rejects Azure credentials and credential-bearing database URLs', () => {
  const azureCredential = ['Account', 'Key=', 'A'.repeat(44)].join('');
  const databaseUrl = ['postgresql://fixture:', 'plausible-value', '@database.example/proprium'].join('');
  assert.equal(scanText('fixtures/azure.txt', azureCredential)[0].code, 'azure-credential');
  assert.equal(scanText('fixtures/database.txt', databaseUrl)[0].code, 'credential-url');
});

test('rejects tracked local environment and private-key file names', () => {
  assert.equal(scanPath('services/api/.env')[0].code, 'tracked-environment');
  assert.equal(scanPath('certificates/service.key')[0].code, 'secret-file');
  assert.equal(scanPath('credentials.json')[0].code, 'credential-file');
});

test('accepts reviewed tracked frontend harness profiles', () => {
  assert.deepEqual(scanPath('apps/web/.env.test'), []);
  assert.deepEqual(scanPath('apps/web/.env.docker'), []);
});

test('rejects broad configuration dumps and raw API exception logging', () => {
  const configurationDump = ['configuration.', 'AsEnumerable();'].join('');
  assert.equal(scanText('services/api/Example.cs', configurationDump)[0].code, 'configuration-dump');
  assert.equal(scanText('services/api/Example.cs', 'logger.LogError(exception, "failed");')[0].code, 'raw-exception-log');
});

test('rejects workflow and Docker secret exfiltration primitives', () => {
  const secretExpression = ['${{ ', 'secrets.DEPLOY_TOKEN', ' }}'].join('');
  assert.equal(
    scanText('.github/workflows/release.yml', `run: echo ${secretExpression}\n`)[0].code,
    'workflow-secret-exposure',
  );
  assert.equal(
    scanText('services/api/Dockerfile', ['ARG DATABASE_', 'PASSWORD\n'].join(''))[0].code,
    'docker-secret-exposure',
  );
});

test('requires Docker build contexts to exclude environment and credential files', () => {
  const findings = scanText('apps/web/.dockerignore', '.env\n.env.*\n');
  assert.ok(findings.some((finding) => finding.code === 'docker-context'));
});
