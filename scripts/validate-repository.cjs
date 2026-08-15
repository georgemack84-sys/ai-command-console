const { existsSync, readFileSync } = require('node:fs');
const { basename, extname } = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  validateConfigurationAuthority,
  validateDotnetProjects,
  validateJson,
  validateMarkdown,
  validatePackageManager,
  validateRequiredFiles,
  validateSolutionCoverage,
  validateTrackedPaths,
  validateYaml,
} = require('./repository-validation-policy.cjs');

const requiredFiles = [
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  '.env.example',
  '.nvmrc',
  'Directory.Build.props',
  'Directory.Build.targets',
  'Directory.Packages.props',
  'global.json',
  'package.json',
  'package-lock.json',
  'apps/web/.env.example',
  'apps/web/.dependency-cruiser.cjs',
  'apps/web/.prettierignore',
  'apps/web/.prettierrc.json',
  'apps/web/eslint.config.mjs',
  'apps/web/package.json',
  'apps/web/package-lock.json',
  'apps/web/tsconfig.json',
  'services/api/.env.example',
  'services/api/Proprium.sln',
  'services/api/Proprium.ArchitectureTests/Proprium.ArchitectureTests.csproj',
  'services/api/Proprium.IntegrationTests/Proprium.IntegrationTests.csproj',
  'README.md',
  'docs/onboarding/developer-setup.md',
  'docs/onboarding/clean-machine-validation.md',
  'docs/engineering/repository-commands.md',
  'docs/operations/local-infrastructure.md',
  'docs/operations/migrations.md',
  'docs/operations/database-reset.md',
  'docs/operations/troubleshooting.md',
  'docs/validation/gp-16-clean-machine.md',
  'docs/validation/day-5/clean-installation.md',
  'docs/validation/day-5/ci-validation.md',
  'docs/validation/day-5/developer-onboarding.md',
  'docs/validation/day-5/repository-validation.md',
  'docs/validation/day-5/qualification.md',
  'docs/validation/day-5/week-2-admission.md',
  'docs/engineering/gp-18-baseline-freeze.md',
  'scripts/validate-configuration.cjs',
  'scripts/validate-developer-documentation.cjs',
  'scripts/validate-day-5-qualification.cjs',
  'scripts/validate-baseline-freeze.cjs',
  'scripts/validate-secrets.cjs',
  'scripts/verify-prerequisites.cjs',
];
const textExtensions = new Set([
  '.cjs', '.cs', '.csproj', '.css', '.html', '.js', '.json', '.jsonl', '.md',
  '.mjs', '.prisma', '.props', '.ps1', '.sh', '.sql', '.targets', '.ts', '.tsx',
  '.txt', '.xml', '.yml', '.yaml',
]);
const textBasenames = new Set([
  '.dockerignore', '.editorconfig', '.gitattributes', '.gitignore', '.prettierignore',
  'CODEOWNERS', 'Dockerfile', 'LICENSE', 'Makefile',
]);
const approvedLocalConfigurations = new Set(['apps/web/.env.docker', 'apps/web/.env.test']);
const governedRoots = ['.github/', 'apps/web/', 'services/api/', 'services/platform-api/', 'docs/'];
const governedRootFiles = new Set([
  '.editorconfig', '.gitattributes', '.gitignore', '.env.example',
  'Directory.Build.props', 'Directory.Build.targets', 'Directory.Packages.props',
  'LICENSE', 'README.md', 'docker-compose.proprium.yml', 'docker-compose.yml',
  'global.json', 'package-lock.json', 'package.json',
]);
const violations = [];

function add(issue) {
  violations.push(issue);
}

function capture(id, path, expected, action) {
  try {
    action();
  } catch (error) {
    add({ id, path, problem: error.message, expected });
  }
}

function fail(message) {
  throw new Error(message);
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, options);
  if (result.error) fail(`Unable to run git ${args.join(' ')}: ${result.error.message}`);
  return result;
}

function trackedFiles() {
  const result = runGit(['ls-files', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) fail('Unable to read tracked files from Git.');
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

function isTextPath(path) {
  const name = basename(path);
  return textExtensions.has(extname(path)) ||
    textBasenames.has(name) ||
    name.startsWith('.env.') ||
    name.endsWith('.example');
}

function isGoverned(path) {
  return governedRootFiles.has(path) || governedRoots.some((root) => path.startsWith(root));
}

function validateEditorConfig(content) {
  const sections = new Map([['<root>', new Map()]]);
  let section = '<root>';
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[') && line.endsWith(']')) {
      section = line;
      if (!sections.has(section)) sections.set(section, new Map());
      continue;
    }
    const separator = line.indexOf('=');
    if (separator === -1) fail(`invalid policy line: ${line}`);
    sections.get(section).set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  const requiredValues = {
    '<root>': { root: 'true' },
    '[*]': {
      charset: 'utf-8',
      end_of_line: 'lf',
      indent_style: 'space',
      insert_final_newline: 'true',
      trim_trailing_whitespace: 'true',
    },
    '[*.md]': { trim_trailing_whitespace: 'false' },
    '[*.ps1]': { end_of_line: 'crlf' },
    '[*.sln]': { end_of_line: 'crlf' },
    '[Makefile]': { indent_style: 'tab' },
  };
  for (const [requiredSection, values] of Object.entries(requiredValues)) {
    const actualSection = sections.get(requiredSection);
    if (!actualSection) fail(`missing required section ${requiredSection}`);
    for (const [key, expected] of Object.entries(values)) {
      if (actualSection.get(key) !== expected) fail(`${requiredSection} must set ${key} = ${expected}`);
    }
  }
}

function attributesFor(path) {
  const result = runGit(['check-attr', '-z', '-a', '--', path], { encoding: 'buffer' });
  if (result.status !== 0) fail(`Unable to resolve Git attributes for ${path}.`);
  const fields = result.stdout.toString('utf8').split('\0').filter(Boolean);
  const attributes = new Map();
  for (let index = 0; index < fields.length; index += 3) attributes.set(fields[index + 1], fields[index + 2]);
  return attributes;
}

function requireAttributes(path, expected) {
  const actual = attributesFor(path);
  for (const [attribute, value] of Object.entries(expected)) {
    if (actual.get(attribute) !== value) {
      fail(`expected ${attribute}=${value}; received ${actual.get(attribute) ?? 'unspecified'}`);
    }
  }
}

function isIgnored(path) {
  const result = runGit(['check-ignore', '--no-index', '--quiet', '--', path]);
  if (result.status !== 0 && result.status !== 1) fail(`Unable to evaluate ignore policy for ${path}.`);
  return result.status === 0;
}

function validateTrackedLineEndings() {
  const result = runGit(['ls-files', '--eol', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) fail('Unable to inspect tracked line endings.');
  for (const record of result.stdout.toString('utf8').split('\0').filter(Boolean)) {
    const [metadata, path] = record.split('\t', 2);
    const match = metadata.match(/^i\/(\S+)\s+w\/(\S+)\s+attr\/(.*)\s+$/);
    if (!match || !path || !isTextPath(path)) continue;
    const [, indexEol, workingEol, attributes] = match;
    if (workingEol === 'mixed') fail(`${path} has mixed working-tree line endings`);
    if (workingEol === 'crlf' && !attributes.includes('eol=crlf')) {
      fail(`${path} has undocumented CRLF working-tree line endings`);
    }
    if (indexEol === 'crlf' || indexEol === 'mixed') {
      const changed = runGit(['diff', '--quiet', '--', path]);
      if (changed.status !== 0 && changed.status !== 1) fail(`Unable to inspect normalization changes for ${path}.`);
      if (changed.status === 0) fail(`${path} stores non-canonical ${indexEol} line endings in Git`);
    }
  }
}

function runComposedValidator(id, path, script) {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  if (result.status === 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    return;
  }
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  add({ id, path, problem: output || `${script} exited with status ${result.status}`, expected: 'the canonical composed validator to pass' });
}

let tracked;
try {
  tracked = trackedFiles();
} catch (error) {
  console.error(`[RVAL-GIT-000] .: ${error.message}`);
  process.exit(1);
}
const trackedSet = new Set(tracked);
const existingRequired = new Set(requiredFiles.filter((path) => existsSync(path)));
violations.push(...validateRequiredFiles(requiredFiles, existingRequired, trackedSet));
violations.push(...validateTrackedPaths(tracked, approvedLocalConfigurations));
violations.push(...validatePackageManager(tracked));
violations.push(...validateConfigurationAuthority(tracked));

capture('RVAL-FILE-003', '.editorconfig', 'the frozen GP-01 editor policy', () =>
  validateEditorConfig(readFileSync('.editorconfig', 'utf8')));

for (const [path, expected] of [
  ['sample.ts', { text: 'auto', eol: 'lf' }],
  ['sample.sh', { text: 'set', eol: 'lf' }],
  ['sample.ps1', { text: 'set', eol: 'crlf' }],
  ['sample.sln', { text: 'set', eol: 'crlf' }],
  ['sample.ico', { binary: 'set', text: 'unset' }],
]) {
  capture('RVAL-GIT-003', '.gitattributes', `canonical attributes for ${path}`, () => requireAttributes(path, expected));
}

for (const path of [
  'scratch/node_modules/package.json',
  'scratch/.next/cache/file',
  'scratch/bin/Debug/example.dll',
  'scratch/obj/project.assets.json',
  'scratch/.env.local',
  'scratch/.idea/workspace.xml',
  'scratch/.vs/state.json',
  'scratch/test-results/result.json',
  'scratch/coverage/lcov.info',
]) {
  capture('RVAL-GIT-004', '.gitignore', `${path} to be ignored`, () => {
    if (!isIgnored(path)) fail(`${path} is not ignored`);
  });
}
for (const path of ['scratch/.env.example', 'apps/web/.env.docker', 'apps/web/.env.test', 'scratch/.vscode/settings.json']) {
  capture('RVAL-GIT-005', '.gitignore', `${path} to remain trackable`, () => {
    if (isIgnored(path)) fail(`${path} is unexpectedly ignored`);
  });
}
capture('RVAL-TEXT-001', '.gitattributes', 'canonical tracked line endings', validateTrackedLineEndings);

for (const path of tracked) {
  if (!existsSync(path) || !isGoverned(path) || !isTextPath(path)) continue;
  const bytes = readFileSync(path);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    add({ id: 'RVAL-TEXT-002', path, problem: 'UTF-8 BOM is present', expected: 'UTF-8 without BOM' });
  }
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    add({ id: 'RVAL-TEXT-003', path, problem: 'file is not valid UTF-8', expected: 'valid UTF-8 text' });
    continue;
  }
  if (content && !content.endsWith('\n')) {
    add({ id: 'RVAL-TEXT-004', path, problem: 'final newline is missing', expected: 'one final newline' });
  }
  if (extname(path) !== '.md') {
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      if (/[ \t]+$/.test(line)) {
        add({ id: 'RVAL-TEXT-005', path: `${path}:${index + 1}`, problem: 'trailing whitespace is present', expected: 'no trailing whitespace' });
      }
    }
  }
  if (extname(path) === '.json') violations.push(...validateJson(path, content));
  if (/\.ya?ml$/.test(path)) violations.push(...validateYaml(path, content));
  if (extname(path) === '.md') {
    violations.push(...validateMarkdown(path, content, (target) => existsSync(target) || trackedSet.has(target)));
  }
}

const backendProjects = new Map(
  tracked
    .filter((path) => /^services\/api\/Proprium\.[^/]+\/[^/]+\.csproj$/.test(path) && existsSync(path))
    .map((path) => [path, readFileSync(path, 'utf8')]),
);
violations.push(...validateDotnetProjects(backendProjects));
if (existsSync('services/api/Proprium.sln')) {
  violations.push(...validateSolutionCoverage(
    'services/api/Proprium.sln',
    readFileSync('services/api/Proprium.sln', 'utf8'),
    [...backendProjects.keys()],
  ));
}

runComposedValidator('RVAL-SECRET-001', 'scripts/validate-secrets.cjs', 'scripts/validate-secrets.cjs');
runComposedValidator('RVAL-ENV-001', 'scripts/validate-configuration.cjs', 'scripts/validate-configuration.cjs');

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`\n[${violation.id}] ${violation.path}\nProblem: ${violation.problem}\nExpected: ${violation.expected}`);
  }
  console.error(`\nRepository validation: FAIL (${violations.length} violation${violations.length === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log(`Repository consistency: PASS (${tracked.length} tracked paths, ${requiredFiles.length} required files)`);
