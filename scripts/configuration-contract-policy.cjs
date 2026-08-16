const { canonicalTemplates } = require('./environment-template-ownership-policy.cjs');
const { canonicalRootKeys } = require('./root-environment-template-policy.cjs');
const { parseEnvironmentTemplate } = require('./environment-template-parser.cjs');
const { scanText } = require('./validate-secrets.cjs');

const webKeys = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_APP_VERSION',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_ENVIRONMENT',
];
const apiKeys = [
  'ASPNETCORE_ENVIRONMENT',
  'ASPNETCORE_URLS',
  'PLATFORM__NAME',
  'PLATFORM__VERSION',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DATABASE',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'SESSION_TOKEN_DIGEST_KEY',
  'SESSION_LIFETIME_MINUTES',
  'AUTH_ALLOWED_ORIGIN',
  'LOGIN_RATE_LIMIT_PRIVACY_KEY',
  'LOGIN_RATE_LIMIT_SOURCE',
  'LOGIN_RATE_LIMIT_IDENTIFIER_SOURCE',
  'LOGIN_RATE_LIMIT_WINDOW_MINUTES',
  'LOGIN_RATE_LIMIT_FALLBACK_CAPACITY',
  'LOCAL_ADMIN_ENABLED',
  'LOCAL_ADMIN_USERNAME',
  'LOCAL_ADMIN_PASSWORD',
];
const sensitiveKeys = new Set([
  'POSTGRES_PASSWORD',
  'REDIS_PASSWORD',
  'SESSION_TOKEN_DIGEST_KEY',
  'LOGIN_RATE_LIMIT_PRIVACY_KEY',
  'LOCAL_ADMIN_PASSWORD',
]);
const approvedSensitiveExamples = new Set([
  '',
  'local-development-only',
  'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
]);
const intentionallySharedKeys = new Set([
  'POSTGRES_DATABASE',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
]);
const configurationContracts = [
  {
    id: 'root',
    ...canonicalTemplates[0],
    heading: '### Repository platform',
    keys: canonicalRootKeys,
  },
  {
    id: 'web',
    ...canonicalTemplates[1],
    heading: '### Web application',
    keys: webKeys,
  },
  {
    id: 'api',
    ...canonicalTemplates[2],
    heading: '### Platform API',
    keys: apiKeys,
  },
];

function validateTemplateContract(contract, content) {
  const parsed = parseEnvironmentTemplate(content, contract.path);
  const errors = [...parsed.errors];
  const expected = new Set(contract.keys);
  for (const key of contract.keys) {
    if (!parsed.values.has(key)) {
      errors.push({
        id: 'CONFIG-003',
        path: contract.path,
        line: 1,
        key,
        message: `required key ${key} is missing`,
      });
    }
  }
  for (const { key, line } of parsed.entries) {
    if (!expected.has(key)) {
      errors.push({
        id: 'CONFIG-005',
        path: contract.path,
        line,
        key,
        message: `key ${key} is not classified for the ${contract.owner} contract`,
      });
    }
  }
  if (contract.id === 'web') {
    for (const { key, line } of parsed.entries) {
      if (!key.startsWith('NEXT_PUBLIC_') || /(PASSWORD|TOKEN|SECRET|PRIVATE_KEY|SIGNING_KEY|CREDENTIAL|CONNECTION_STRING)/.test(key)) {
        errors.push({
          id: 'CONFIG-006',
          path: contract.path,
          line,
          key,
          message: `${key} violates the browser-public configuration boundary`,
        });
      }
    }
    const apiUrl = parsed.values.get('NEXT_PUBLIC_API_BASE_URL');
    if (apiUrl !== undefined) {
      try {
        const url = new URL(apiUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
      } catch {
        errors.push({
          id: 'CONFIG-006',
          path: contract.path,
          line: parsed.entries.find(({ key }) => key === 'NEXT_PUBLIC_API_BASE_URL')?.line ?? 1,
          key: 'NEXT_PUBLIC_API_BASE_URL',
          message: 'NEXT_PUBLIC_API_BASE_URL must be an absolute credential-free HTTP(S) URL without query or fragment',
        });
      }
    }
  }
  for (const { key, value, line } of parsed.entries) {
    if (sensitiveKeys.has(key) && !approvedSensitiveExamples.has(value)) {
      errors.push({
        id: 'CONFIG-005',
        path: contract.path,
        line,
        key,
        message: `${key} must use an approved non-production placeholder`,
      });
    }
  }
  for (const finding of scanText(contract.path, content)) {
    if (!errors.some(({ line, message }) => line === finding.line && message === finding.message)) {
      errors.push({
        id: contract.id === 'web' ? 'CONFIG-006' : 'CONFIG-005',
        path: finding.path,
        line: finding.line,
        message: finding.message,
      });
    }
  }
  return errors;
}

module.exports = {
  apiKeys,
  approvedSensitiveExamples,
  configurationContracts,
  intentionallySharedKeys,
  sensitiveKeys,
  validateTemplateContract,
  webKeys,
};
