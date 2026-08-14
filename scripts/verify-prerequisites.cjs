#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const expectedNodeMajor = Number(readFileSync(join(repositoryRoot, '.nvmrc'), 'utf8').trim());
const dotnetPolicy = JSON.parse(readFileSync(join(repositoryRoot, 'global.json'), 'utf8')).sdk;
const failures = [];

function run(label, name, args) {
  const result = spawnSync(name, args, { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.error) {
    failures.push(`${label}: ${name} was not found on PATH`);
    return null;
  }
  if (result.status !== 0) {
    failures.push(`${label}: ${name} ${args.join(' ')} exited with status ${result.status}`);
    return null;
  }
  const output = (result.stdout || result.stderr).trim();
  console.log(`${label}: ${output}`);
  return output;
}

function featureBand(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}.${Math.floor(Number(match[3]) / 100)}` : null;
}

console.log(`Repository: ${repositoryRoot}`);
run('Git', 'git', ['--version']);

const actualNodeMajor = Number(process.versions.node.split('.')[0]);
console.log(`Node.js: ${process.version}`);
if (actualNodeMajor !== expectedNodeMajor) {
  failures.push(`Node.js: expected major ${expectedNodeMajor} from .nvmrc; found ${actualNodeMajor}`);
}
const npmCli = process.env.npm_execpath ??
  join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
if (process.platform === 'win32' && existsSync(npmCli)) {
  run('npm', process.execPath, [npmCli, '--version']);
} else {
  run('npm', 'npm', ['--version']);
}

const dotnetVersion = run('.NET SDK', 'dotnet', ['--version']);
if (dotnetVersion && featureBand(dotnetVersion) !== featureBand(dotnetPolicy.version)) {
  failures.push(`.NET SDK: expected feature band ${featureBand(dotnetPolicy.version)} from global.json; found ${dotnetVersion}`);
}

run('Docker CLI', 'docker', ['--version']);
run('Docker Compose', 'docker', ['compose', 'version']);
run('Docker daemon', 'docker', ['info', '--format', '{{.ServerVersion}}']);

if (process.platform === 'win32') run('PowerShell', 'pwsh', ['--version']);

if (failures.length > 0) {
  for (const failure of failures) console.error(`Prerequisite failure: ${failure}`);
  process.exit(1);
}

console.log('Developer prerequisites: PASS');
