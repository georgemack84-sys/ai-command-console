const assert = require('node:assert/strict');
const {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { after, test } = require('node:test');

const repositoryRoot = join(__dirname, '..');
const wrapper = join(__dirname, 'proprium.ps1');
const dispatcher = join(__dirname, 'proprium-command.cjs');
const where = spawnSync('where.exe', ['pwsh.exe'], { encoding: 'utf8' });
const powerShell =
  process.platform === 'win32' && where.status === 0
    ? where.stdout.trim().split(/\r?\n/)[0]
    : undefined;
const windowsOnly = { skip: powerShell ? false : 'PowerShell 7 on Windows required' };
const temporaryDirectories = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function runWrapper(arguments_, options = {}) {
  return spawnSync(
    powerShell,
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', wrapper, ...arguments_],
    {
      cwd: options.cwd ?? repositoryRoot,
      encoding: 'utf8',
      env: options.env ?? process.env,
    },
  );
}

test('PowerShell wrapper succeeds independently of the caller directory', windowsOnly, () => {
  const result = runWrapper(['help'], { cwd: __dirname });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Canonical repository commands:/);
});

test('PowerShell wrapper safely forwards multi-token commands', windowsOnly, () => {
  const result = runWrapper(['validate', 'future'], { cwd: dirname(repositoryRoot) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command: validate future/);
  assert.match(result.stderr, /Valid commands: validate repo/);
});

test('PowerShell Force switch becomes the dispatcher confirmation flag', windowsOnly, () => {
  const result = runWrapper(['future', '-Force']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command: future --force/);
});

test('PowerShell wrapper and dispatcher support repository paths with spaces', windowsOnly, () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'proprium gp14 '));
  temporaryDirectories.push(fixtureRoot);
  const fixtureScripts = join(fixtureRoot, 'scripts');
  const caller = join(fixtureRoot, 'nested caller');
  mkdirSync(fixtureScripts);
  mkdirSync(caller);
  copyFileSync(wrapper, join(fixtureScripts, 'proprium.ps1'));
  copyFileSync(dispatcher, join(fixtureScripts, 'proprium-command.cjs'));

  const result = spawnSync(
    powerShell,
    [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-File',
      join(fixtureScripts, 'proprium.ps1'),
      'help',
    ],
    { cwd: caller, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage: npm run repo -- <command>/);
});

test('PowerShell wrapper fails clearly when Node.js is missing', windowsOnly, () => {
  const result = runWrapper(['help'], {
    env: { ...process.env, PATH: '', Path: '' },
  });

  assert.equal(result.status, 127);
  assert.match(result.stderr, /Node\.js 24 or later is required/);
  assert.match(result.stderr, /not found on PATH/);
});
