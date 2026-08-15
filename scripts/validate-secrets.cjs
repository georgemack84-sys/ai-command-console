const { existsSync, readFileSync } = require('node:fs');
const { basename, extname } = require('node:path');
const { spawnSync } = require('node:child_process');

const approvedTrackedEnvironmentProfiles = new Set(['apps/web/.env.docker', 'apps/web/.env.test']);
const approvedPublicIdentifiers = new Set(['NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN']);
const prohibitedSecretExtensions = new Set(['.jks', '.key', '.keystore', '.p12', '.pem', '.pfx']);
const prohibitedSecretBasenames = new Set(['credentials.json']);
const sensitiveName = '(?:PASSWORD|SECRET|TOKEN|PRIVATE_KEY|SIGNING_KEY|CLIENT_SECRET|API_KEY|CREDENTIAL|CONNECTION_STRING)';
const publicSecretName = new RegExp(`NEXT_PUBLIC_[A-Z0-9_]*${sensitiveName}[A-Z0-9_]*`, 'g');
const privateKeyMarker = new RegExp('-----BEGIN ' + '(?:RSA |EC |OPENSSH )?' + 'PRIVATE KEY-----', 'g');
const providerTokens = [
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
];
const approvedEncodedTestKey = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';

function issue(path, content, index, code, message) {
  return { path, line: content.slice(0, index).split(/\r?\n/).length, code, message };
}

function isEnvironmentFile(path) {
  const name = basename(path);
  return name === '.env' || name.startsWith('.env.');
}

function scanPath(path) {
  const normalized = path.replaceAll('\\', '/');
  const name = basename(normalized).toLowerCase();
  if (approvedTrackedEnvironmentProfiles.has(normalized)) return [];
  if (isEnvironmentFile(normalized) && !name.endsWith('.example')) {
    return [{ path: normalized, line: 1, code: 'tracked-environment', message: 'local environment files must not be tracked' }];
  }
  if (prohibitedSecretExtensions.has(extname(name))) {
    return [{ path: normalized, line: 1, code: 'secret-file', message: 'private key and certificate containers require an approved external store' }];
  }
  if (prohibitedSecretBasenames.has(name) || /^service-account.*\.json$/i.test(name)) {
    return [{ path: normalized, line: 1, code: 'credential-file', message: 'credential files must not be tracked' }];
  }
  return [];
}

function isProhibitedLiteralLocation(path) {
  const normalized = path.replaceAll('\\', '/');
  const name = basename(normalized);
  return name.endsWith('.example')
    || /(^|\/)appsettings(?:\.[^.]+)?\.json$/i.test(normalized)
    || normalized.startsWith('.github/workflows/')
    || /(^|\/)Dockerfile$/i.test(normalized)
    || /(^|\/)docker-compose(?:\.[^.]+)?\.ya?ml$/i.test(normalized);
}

function normalizeLiteral(value) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function isApprovedExample(path, key, rawValue) {
  const value = normalizeLiteral(rawValue);
  if (!value || value === '""' || value === "''") return true;
  if (/^\$\{(?:\{\s*secrets\.|[A-Z0-9_]+[}:])/i.test(value)) return true;
  if (value === approvedEncodedTestKey) return true;
  if (/(?:change-me|replace|placeholder|not-a-real|local-development|test-only|ci-placeholder)/i.test(value)) return true;
  // Explicit disposable credential for the legacy local-only PostgreSQL container.
  if (path === 'docker-compose.yml' && key === 'POSTGRES_PASSWORD' && value === 'postgres') return true;
  return false;
}

function scanSensitiveAssignments(path, content) {
  if (!isProhibitedLiteralLocation(path)) return [];
  const issues = [];
  const assignment = new RegExp(`^\\s*([A-Z][A-Z0-9_]*${sensitiveName}[A-Z0-9_]*)\\s*[:=]\\s*(.*?)\\s*$`);
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (line.trimStart().startsWith('#')) continue;
    const match = line.match(assignment);
    if (match && !isApprovedExample(path, match[1], match[2])) {
      issues.push({ path, line: index + 1, code: 'unsafe-literal', message: `${match[1]} must use external injection or an approved non-production placeholder` });
    }
  }
  return issues;
}

function scanCredentialUrls(path, content) {
  const issues = [];
  const credentialUrl = /[A-Za-z][A-Za-z0-9+.-]*:\/\/([^\s:/@]+):([^\s/@]+)@([^\s/:?#]+)/g;
  for (const match of content.matchAll(credentialUrl)) {
    const [, username, password, host] = match;
    const localDisposable = /^(?:localhost|127\.0\.0\.1)$/i.test(host)
      && /^(?:postgres|local-development-only)$/i.test(password);
    const isolatedTest = /(^|\/)tests?\//i.test(path)
      && /(?:test|secret|example|local)/i.test(`${username}:${password}`);
    const explicitPlaceholder = /(?:change-me|replace|placeholder|not-a-real|local-development|test-only)/i.test(password);
    if (!localDisposable && !isolatedTest && !explicitPlaceholder) {
      issues.push(issue(path, content, match.index, 'credential-url', 'credential-bearing URLs must be external or an explicit disposable test fixture'));
    }
  }
  return issues;
}

function scanText(path, content) {
  const normalized = path.replaceAll('\\', '/');
  const issues = [];
  if (content.includes('\0')) return issues;

  for (const match of content.matchAll(privateKeyMarker)) {
    issues.push(issue(normalized, content, match.index, 'private-key', 'private key material must not be tracked'));
  }
  for (const pattern of providerTokens) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      issues.push(issue(normalized, content, match.index, 'provider-token', 'provider token signature must not be tracked'));
    }
  }
  for (const match of content.matchAll(publicSecretName)) {
    if (approvedPublicIdentifiers.has(match[0])) continue;
    issues.push(issue(normalized, content, match.index, 'public-secret-name', `${match[0]} may not use the browser-visible namespace`));
  }

  issues.push(...scanSensitiveAssignments(normalized, content));
  issues.push(...scanCredentialUrls(normalized, content));

  const dumpPatterns = [
    /\b(?:configuration|config)\.AsEnumerable\s*\(/g,
    /\b(?:configuration|config)\.GetDebugView\s*\(/g,
    /JSON\.stringify\s*\(\s*process\.env\s*\)/g,
  ];
  for (const pattern of dumpPatterns) {
    for (const match of content.matchAll(pattern)) {
      issues.push(issue(normalized, content, match.index, 'configuration-dump', 'broad configuration dumps are prohibited'));
    }
  }
  if (normalized.startsWith('services/api/') && normalized.endsWith('.cs')) {
    const rawExceptionLog = /\b(?:logger|_logger)\.Log(?:Trace|Debug|Information|Warning|Error|Critical)\s*\(\s*(?:exception|[A-Za-z]+Exception)\s*,/g;
    for (const match of content.matchAll(rawExceptionLog)) {
      issues.push(issue(normalized, content, match.index, 'raw-exception-log', 'raw exception objects may carry secret values and must not be logged'));
    }
  }
  return issues;
}

function trackedFiles() {
  const result = spawnSync('git', ['ls-files', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) throw new Error('Unable to inspect tracked files for secret safety.');
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

function scanRepository() {
  const issues = [];
  for (const path of trackedFiles()) {
    issues.push(...scanPath(path));
    if (!existsSync(path)) continue;
    const bytes = readFileSync(path);
    if (bytes.length > 5_000_000 || bytes.includes(0)) continue;
    issues.push(...scanText(path, bytes.toString('utf8')));
  }
  return issues;
}

function main() {
  const issues = scanRepository();
  if (issues.length) {
    for (const finding of issues) console.error(`${finding.path}:${finding.line} [${finding.code}] ${finding.message}`);
    console.error(`Secret safety: FAIL (${issues.length} finding${issues.length === 1 ? '' : 's'}; candidate values suppressed)`);
    process.exit(1);
  }
  console.log('Secret safety: PASS');
}

if (require.main === module) main();

module.exports = { isApprovedExample, scanPath, scanText };
