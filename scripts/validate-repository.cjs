const { existsSync, readFileSync } = require('node:fs');
const { dirname, extname, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const requiredFiles = ['.editorconfig', '.gitattributes', '.gitignore', '.env.example', 'apps/web/.env.example', 'services/platform-api/.env.example', 'services/api/.env.example', 'scripts/validate-configuration.cjs'];
const textExtensions = new Set(['.cjs', '.cs', '.csproj', '.css', '.json', '.md', '.mjs', '.props', '.ps1', '.ts', '.tsx', '.xml', '.yml', '.yaml']);
const prohibitedLocalFiles = new Set(['.env', '.env.local', '.env.production', '.env.development', 'apps/web/.env.local', 'services/platform-api/.env', 'services/api/.env']);
const governedRoots = ['.github/', 'apps/web/', 'services/api/', 'services/platform-api/', 'docs/'];
const governedRootFiles = new Set(['.editorconfig', '.gitattributes', '.gitignore', '.env.example', 'Directory.Build.props', 'Directory.Packages.props', 'global.json', 'package.json']);

function fail(message) { throw new Error(message); }
function trackedFiles() {
  const result = spawnSync('git', ['ls-files', '-z'], { encoding: 'buffer' });
  if (result.status !== 0) fail('Unable to read tracked files from Git.');
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
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
  try { yaml.load(content, { json: false }); } catch (error) { fail(`${path} is not valid YAML: ${error.message}`); }
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/^\s*#|^\s*$/.test(line)) continue;
    if (/\t/.test(line)) fail(`${path}:${index + 1} contains a tab.`);
    const match = line.match(/^( *)([A-Za-z0-9_.-]+):(?:\s|$)/);
    if (!match) continue;
    if (match[1].length % 2) fail(`${path}:${index + 1} has non-canonical YAML indentation.`);
  }
}

for (const path of requiredFiles) if (!existsSync(path)) fail(`Required repository file is missing: ${path}.`);
const attributes = readFileSync('.gitattributes', 'utf8');
if (!attributes.includes('* text=auto eol=lf') || !attributes.includes('*.ps1 text eol=crlf')) fail('.gitattributes must define canonical LF and the PowerShell CRLF exception.');
for (const path of trackedFiles()) {
  if (prohibitedLocalFiles.has(path)) fail(`Local configuration must not be committed: ${path}.`);
  if (!governedRootFiles.has(path) && !governedRoots.some((root) => path.startsWith(root))) continue;
  if (!textExtensions.has(extname(path)) && !path.endsWith('Dockerfile')) continue;
  const bytes = readFileSync(path);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) fail(`${path} contains a UTF-8 BOM.`);
  const content = bytes.toString('utf8');
  if (content && !content.endsWith('\n')) fail(`${path} is missing a final newline.`);
  if (extname(path) === '.json') { try { JSON.parse(content); } catch { fail(`${path} is not valid JSON.`); } }
  if (/\.ya?ml$/.test(path)) validateYaml(path, content);
  if (extname(path) === '.md') validateMarkdown(path, content);
}

const configuration = spawnSync(process.execPath, ['scripts/validate-configuration.cjs'], { stdio: 'inherit' });
if (configuration.status !== 0) process.exit(configuration.status ?? 1);
console.log('Repository consistency: PASS');
