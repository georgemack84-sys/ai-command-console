const { existsSync, readFileSync } = require('node:fs');
const { basename, dirname, extname, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const baselineFiles = ['.editorconfig', '.gitattributes', '.gitignore'];
const configurationFiles = [
  '.env.example',
  'apps/web/.env.example',
  'services/api/.env.example',
  'scripts/validate-configuration.cjs',
];
const textExtensions = new Set([
  '.cjs', '.cs', '.csproj', '.css', '.html', '.js', '.json', '.jsonl', '.md',
  '.mjs', '.prisma', '.props', '.ps1', '.sh', '.sql', '.ts', '.tsx', '.txt',
  '.xml', '.yml', '.yaml',
]);
const textBasenames = new Set([
  '.dockerignore', '.editorconfig', '.gitattributes', '.gitignore', '.prettierignore',
  'CODEOWNERS', 'Dockerfile', 'LICENSE', 'Makefile',
]);
const approvedLocalConfigurations = new Set(['apps/web/.env.docker', 'apps/web/.env.test']);
const governedRoots = ['.github/', 'apps/web/', 'services/api/', 'services/platform-api/', 'docs/'];
const governedRootFiles = new Set([
  '.editorconfig', '.gitattributes', '.gitignore', '.env.example',
  'Directory.Build.props', 'Directory.Packages.props', 'LICENSE', 'global.json', 'package.json',
]);
const prohibitedArtifact = /(^|\/)(node_modules|\.next|\.idea|\.vs|bin|coverage|obj|playwright-artifacts|playwright-report|storybook-static|test-results)(\/|$)|\.sqlite(?:-shm|-wal)?$|\.tsbuildinfo$/i;

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
  return textExtensions.has(extname(path))
    || textBasenames.has(name)
    || name.startsWith('.env.')
    || name.endsWith('.example');
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
    if (separator === -1) fail(`.editorconfig contains an invalid policy line: ${line}.`);
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
    if (!actualSection) fail(`.editorconfig is missing required section ${requiredSection}.`);
    for (const [key, expected] of Object.entries(values)) {
      if (actualSection.get(key) !== expected) {
        fail(`.editorconfig ${requiredSection} must set ${key} = ${expected}.`);
      }
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
      fail(`${path} must resolve Git attribute ${attribute}=${value}; received ${actual.get(attribute) ?? 'unspecified'}.`);
    }
  }
}

function isIgnored(path) {
  const result = runGit(['check-ignore', '--no-index', '--quiet', '--', path]);
  if (result.status !== 0 && result.status !== 1) fail(`Unable to evaluate ignore policy for ${path}.`);
  return result.status === 0;
}

function requireIgnored(path) {
  if (!isIgnored(path)) fail(`${path} must be ignored by the root .gitignore policy.`);
}

function requireTrackable(path) {
  if (isIgnored(path)) fail(`${path} must remain trackable under the root .gitignore policy.`);
}

function isProhibitedLocalConfiguration(path) {
  if (approvedLocalConfigurations.has(path)) return false;
  const name = basename(path);
  if (name === '.env.example' || name.endsWith('.example')) return false;
  return name === '.env' || name.startsWith('.env.');
}

function validateTrackedLineEndings() {
  const result = runGit(['ls-files', '--eol', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) fail('Unable to inspect tracked line endings.');
  for (const record of result.stdout.toString('utf8').split('\0').filter(Boolean)) {
    const [metadata, path] = record.split('\t', 2);
    const match = metadata.match(/^i\/(\S+)\s+w\/(\S+)\s+attr\/(.*)\s+$/);
    if (!match || !path || !isTextPath(path)) continue;
    const [, indexEol, workingEol, attributes] = match;
    if (workingEol === 'mixed') fail(`${path} has mixed working-tree line endings.`);
    if (workingEol === 'crlf' && !attributes.includes('eol=crlf')) {
      fail(`${path} has undocumented CRLF working-tree line endings.`);
    }
    if (indexEol === 'crlf' || indexEol === 'mixed') {
      const changed = runGit(['diff', '--quiet', '--', path]);
      if (changed.status !== 0 && changed.status !== 1) fail(`Unable to inspect normalization changes for ${path}.`);
      if (changed.status === 0) fail(`${path} stores non-canonical ${indexEol} line endings in Git.`);
    }
  }
}

function validateMarkdown(path, content) {
  const fences = (content.match(/^\s*```/gm) ?? []).length;
  if (fences % 2) fail(`${path} has an unclosed fenced code block.`);
  let previousLevel = 0;
  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+\S/);
    if (!heading) continue;
    const level = heading[1].length;
    if (previousLevel && level > previousLevel + 1) fail(`${path} skips heading levels.`);
    previousLevel = level;
  }
  for (const match of content.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(path), target))) fail(`${path} links to missing local file ${target}.`);
  }
}

function validateYaml(path, content) {
  try {
    yaml.load(content, { json: false });
  } catch (error) {
    fail(`${path} is not valid YAML: ${error.message}`);
  }
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/^\s*#|^\s*$/.test(line)) continue;
    if (/\t/.test(line)) fail(`${path}:${index + 1} contains a tab.`);
    const match = line.match(/^( *)([A-Za-z0-9_.-]+):(?:\s|$)/);
    if (match && match[1].length % 2) fail(`${path}:${index + 1} has non-canonical YAML indentation.`);
  }
}

for (const path of [...baselineFiles, ...configurationFiles]) {
  if (!existsSync(path)) fail(`Required repository file is missing: ${path}.`);
}

validateEditorConfig(readFileSync('.editorconfig', 'utf8'));
requireAttributes('sample.ts', { text: 'auto', eol: 'lf' });
requireAttributes('sample.sh', { text: 'set', eol: 'lf' });
requireAttributes('sample.ps1', { text: 'set', eol: 'crlf' });
requireAttributes('sample.sln', { text: 'set', eol: 'crlf' });
requireAttributes('sample.ico', { binary: 'set', text: 'unset' });

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
]) requireIgnored(path);
for (const path of ['scratch/.env.example', 'apps/web/.env.docker', 'apps/web/.env.test', 'scratch/.vscode/settings.json']) {
  requireTrackable(path);
}

validateTrackedLineEndings();
for (const path of trackedFiles()) {
  // A local validation run may intentionally remove a tracked artifact or a
  // superseded nested policy file before the change is staged.
  if (!existsSync(path)) continue;
  if (isProhibitedLocalConfiguration(path)) fail(`Local configuration must not be committed: ${path}.`);
  if (prohibitedArtifact.test(path)) fail(`Generated or local artifact must not be committed: ${path}.`);
  if (!governedRootFiles.has(path) && !governedRoots.some((root) => path.startsWith(root))) continue;
  if (!isTextPath(path)) continue;

  const bytes = readFileSync(path);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) fail(`${path} contains a UTF-8 BOM.`);
  let content;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail(`${path} is not valid UTF-8.`);
  }
  if (content && !content.endsWith('\n')) fail(`${path} is missing a final newline.`);
  if (extname(path) !== '.md') {
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      if (/[ \t]+$/.test(line)) fail(`${path}:${index + 1} has trailing whitespace.`);
    }
  }
  if (extname(path) === '.json') {
    try {
      JSON.parse(content);
    } catch {
      fail(`${path} is not valid JSON.`);
    }
  }
  if (/\.ya?ml$/.test(path)) validateYaml(path, content);
  if (extname(path) === '.md') validateMarkdown(path, content);
}

const configuration = spawnSync(process.execPath, ['scripts/validate-configuration.cjs'], { stdio: 'inherit' });
if (configuration.status !== 0) process.exit(configuration.status ?? 1);
console.log('Repository consistency: PASS');
