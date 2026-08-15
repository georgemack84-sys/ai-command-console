const { readFileSync } = require('node:fs');
const { basename } = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  canonicalTemplates,
  validateEnvironmentTemplateOwnership,
} = require('./environment-template-ownership-policy.cjs');
const {
  canonicalRootKeys,
  validateRootComposeAlignment,
  validateRootEnvironmentTemplate,
} = require('./root-environment-template-policy.cjs');
const { parseEnvironmentTemplate } = require('./environment-template-parser.cjs');
const {
  apiKeys,
  approvedSensitiveExamples,
  intentionallySharedKeys,
  sensitiveKeys,
  webKeys,
} = require('./configuration-contract-policy.cjs');

const templates = {
  root: canonicalTemplates[0].path,
  web: canonicalTemplates[1].path,
  api: canonicalTemplates[2].path,
};

const rootKeys = canonicalRootKeys;
const approvedTrackedLocalProfiles = new Set(['apps/web/.env.docker', 'apps/web/.env.test']);

function fail(message) {
  throw new Error(message);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, options);
  if (result.error) fail(`Unable to run git ${args.join(' ')}: ${result.error.message}`);
  return result;
}

function parseTemplate(name, path, content = readFileSync(path, 'utf8')) {
  const parsed = parseEnvironmentTemplate(content, path);
  if (parsed.errors.length) {
    const error = parsed.errors[0];
    fail(`[${error.id}] ${path}:${error.line} ${error.message}.`);
  }
  if (!parsed.values.size) fail(`${name} template is empty.`);
  return parsed.values;
}

function requireExactKeys(name, values, expected) {
  const expectedSet = new Set(expected);
  for (const key of expected) if (!values.has(key)) fail(`${name} is missing ${key}.`);
  for (const key of values.keys()) if (!expectedSet.has(key)) fail(`${name} contains unclassified key ${key}.`);
}

function requireTracked(path) {
  const result = runGit(['ls-files', '--error-unmatch', '--', path], { stdio: 'ignore' });
  if (result.status !== 0) fail(`${path} must be tracked by Git.`);
}

function ignoreStatus(path) {
  const result = runGit(['check-ignore', '--no-index', '--quiet', '--', path], { stdio: 'ignore' });
  if (result.status !== 0 && result.status !== 1) fail(`Unable to evaluate ignore policy for ${path}.`);
  return result.status === 0;
}

function requireIgnored(path) {
  if (!ignoreStatus(path)) fail(`${path} must be ignored by Git.`);
}

function requireTrackable(path) {
  if (ignoreStatus(path)) fail(`${path} must remain trackable.`);
}

function requireConsumers(values, path, consumerFiles) {
  const consumers = consumerFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const key of values.keys()) {
    const hierarchicalParts = key.split('__');
    const hasHierarchicalConsumer = hierarchicalParts.length > 1
      && hierarchicalParts.every((part) => consumers.toUpperCase().includes(part));
    if (!consumers.includes(key) && !hasHierarchicalConsumer) {
      fail(`${path} contains phantom variable ${key}.`);
    }
  }
}

function validateExamples(path, values) {
  for (const [key, value] of values) {
    if (/(?:gh[pousr]_|github_pat_|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN [A-Z ]*PRIVATE KEY)/.test(value)) {
      fail(`${path} contains credential-like material in ${key}.`);
    }
    if (sensitiveKeys.has(key) && !approvedSensitiveExamples.has(value)) {
      fail(`${path} must use an approved non-production example for ${key}.`);
    }
  }
}

function trackedFiles() {
  const result = runGit(['ls-files', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) fail('Unable to inspect tracked environment files.');
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

const tracked = trackedFiles();
const topologyErrors = validateEnvironmentTemplateOwnership({
  trackedPaths: tracked,
  ignoredPaths: [
    ...canonicalTemplates.map(({ path }) => path),
    ...canonicalTemplates.map(({ local }) => local),
  ].filter(ignoreStatus),
  contentsByPath: new Map(
    canonicalTemplates.map(({ path }) => [path, readFileSync(path, 'utf8')]),
  ),
});
if (topologyErrors.length) fail(topologyErrors.join('\n'));

for (const path of Object.values(templates)) {
  requireTracked(path);
  requireTrackable(path);
}

const rootContent = readFileSync(templates.root, 'utf8');
const boundary = '# Transitional root application contract.';
if (!rootContent.includes(boundary)) fail(`${templates.root} is missing the transitional ownership boundary.`);
const rootSection = rootContent.split(boundary, 1)[0];
const rootErrors = validateRootEnvironmentTemplate(rootSection);
if (rootErrors.length) fail(rootErrors.join('\n'));
const composeErrors = validateRootComposeAlignment(readFileSync('docker-compose.proprium.yml', 'utf8'));
if (composeErrors.length) fail(composeErrors.join('\n'));
const root = parseTemplate('root Proprium section', templates.root, rootSection);
const rootComplete = parseTemplate('root', templates.root, rootContent);
const web = parseTemplate('frontend', templates.web);
const api = parseTemplate('backend', templates.api);

requireExactKeys('root Proprium section', root, rootKeys);
requireExactKeys('frontend template', web, webKeys);
requireExactKeys('backend template', api, apiKeys);

requireConsumers(root, templates.root, ['docker-compose.proprium.yml']);
requireConsumers(web, templates.web, ['apps/web/src/config/environment-schema.ts']);
requireConsumers(api, templates.api, [
  'services/api/Proprium.Api/Configuration/ApiConfiguration.cs',
  'services/api/Proprium.Api/Program.cs',
  'services/api/Proprium.Api/appsettings.json',
  'services/api/Proprium.Api/Configuration/PlatformOptions.cs',
  'services/api/Proprium.Api/Dockerfile',
  'docker-compose.proprium.yml',
]);

for (const [key, value] of web) {
  if (!key.startsWith('NEXT_PUBLIC_')) fail(`Frontend key ${key} is not browser-exposed configuration.`);
  if (/(PASSWORD|TOKEN|SECRET|KEY|CREDENTIAL|CONNECTION)/.test(key)) {
    fail(`Frontend template exposes a secret-like public variable ${key}.`);
  }
  if (/(password=|BEGIN .*PRIVATE KEY|gh[pousr]_|github_pat_|sk-)/i.test(value)) {
    fail(`Frontend template exposes credential-like material through ${key}.`);
  }
}

validateExamples(templates.root, rootComplete);
validateExamples(templates.web, web);
validateExamples(templates.api, api);

const inventories = { root, web, api };
const ownersByKey = new Map();
for (const [owner, values] of Object.entries(inventories)) {
  for (const key of values.keys()) {
    const owners = ownersByKey.get(key) ?? [];
    owners.push(owner);
    ownersByKey.set(key, owners);
  }
}
for (const [key, owners] of ownersByKey) {
  if (owners.length > 1 && !intentionallySharedKeys.has(key)) {
    fail(`${key} has duplicate template ownership: ${owners.join(', ')}.`);
  }
}

for (const path of tracked) {
  if (approvedTrackedLocalProfiles.has(path)) continue;
  const name = basename(path);
  if (name === '.env' || (name.startsWith('.env.') && !name.endsWith('.example'))) {
    fail(`Potential local environment file is tracked: ${path}.`);
  }
}

[
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.development.local',
  'apps/web/.env.local',
  'services/api/.env',
].forEach(requireIgnored);

console.log('Configuration templates and secret boundaries: PASS');
