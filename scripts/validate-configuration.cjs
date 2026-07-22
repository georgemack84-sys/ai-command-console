const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const templates = {
  root: '.env.example',
  web: 'apps/web/.env.example',
  platformApi: 'services/platform-api/.env.example',
  apiMirror: 'services/api/.env.example',
};

function parseTemplate(name, path) {
  const values = new Map();
  for (const [index, line] of readFileSync(path, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) throw new Error(`${path}:${index + 1} is malformed.`);
    if (values.has(match[1])) throw new Error(`${path}:${index + 1} duplicates ${match[1]}.`);
    values.set(match[1], match[2]);
  }
  if (!values.size) throw new Error(`${name} template is empty.`);
  return values;
}

function requireKeys(name, values, keys) {
  for (const key of keys) if (!values.has(key)) throw new Error(`${name} is missing required key ${key}.`);
}

function requireIgnored(path) {
  const result = spawnSync('git', ['check-ignore', '-q', '--no-index', path], { stdio: 'ignore' });
  if (result.status !== 0) throw new Error(`${path} must be ignored by Git.`);
}

const root = parseTemplate('root', templates.root);
const web = parseTemplate('web', templates.web);
const platformApi = parseTemplate('platform API', templates.platformApi);
const apiMirror = parseTemplate('API mirror', templates.apiMirror);

requireKeys('root', root, ['APP_NAME', 'APP_ENVIRONMENT', 'APP_VERSION', 'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DATABASE', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'API_PORT', 'WEB_PORT']);
requireKeys('web', web, ['NEXT_PUBLIC_APP_NAME', 'NEXT_PUBLIC_APP_VERSION', 'NEXT_PUBLIC_API_BASE_URL']);
requireKeys('platform API', platformApi, ['APP_NAME', 'APP_ENVIRONMENT', 'APP_VERSION', 'ASPNETCORE_ENVIRONMENT', 'ASPNETCORE_URLS', 'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DATABASE', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD']);

for (const [key, value] of web) {
  if (!key.startsWith('NEXT_PUBLIC_')) throw new Error(`Frontend key ${key} is not browser-safe.`);
  if (/(PASSWORD|TOKEN|SECRET|KEY|CONNECTION)/.test(key) || /(password=|BEGIN .*PRIVATE KEY|ghp_|sk-)/i.test(value)) throw new Error(`Frontend template exposes a secret through ${key}.`);
}

if (root.get('POSTGRES_PASSWORD') !== 'change-me' || platformApi.get('POSTGRES_PASSWORD') !== 'change-me') throw new Error('Database password examples must remain the non-production placeholder change-me.');
for (const [key, value] of platformApi) if (apiMirror.get(key) !== value) throw new Error(`Backend compatibility mirror drifted at ${key}.`);

['.env', '.env.local', '.env.production', '.env.development', 'apps/web/.env.local', 'services/platform-api/.env', 'services/api/.env'].forEach(requireIgnored);
console.log('Configuration templates and secret boundaries: PASS');
