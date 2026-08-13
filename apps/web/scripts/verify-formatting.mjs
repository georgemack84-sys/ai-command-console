import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const require = createRequire(import.meta.url);
const prettierCli = require.resolve('prettier/bin/prettier.cjs');
const fixtureRoot = mkdtempSync(join(tmpdir(), 'proprium-formatting-'));

function runPrettier(...arguments_) {
  return spawnSync(process.execPath, [prettierCli, ...arguments_], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  });
}

function diagnostic(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

try {
  copyFileSync(
    join(packageRoot, '.prettierrc.json'),
    join(fixtureRoot, '.prettierrc.json'),
  );
  copyFileSync(
    join(packageRoot, '.prettierignore'),
    join(fixtureRoot, '.prettierignore'),
  );
  mkdirSync(join(fixtureRoot, 'src'));
  mkdirSync(join(fixtureRoot, '.next'));

  const formattedPath = join(fixtureRoot, 'src', 'formatted.ts');
  const ignoredPath = join(fixtureRoot, '.next', 'generated.js');
  writeFileSync(formattedPath, 'export const answer = { value: 42 };\n');
  writeFileSync(ignoredPath, 'export const ignored={value:1}\n');

  const cleanCheck = runPrettier('--check', '.');
  assert.equal(cleanCheck.status, 0, diagnostic(cleanCheck));

  const driftPath = join(fixtureRoot, 'src', 'drift.ts');
  const drift = 'export const drift={value:1}\r\n';
  writeFileSync(driftPath, drift);
  const failingCheck = runPrettier('--check', '.');
  assert.notEqual(
    failingCheck.status,
    0,
    'format:check accepted deliberately misformatted source',
  );
  assert.match(
    diagnostic(failingCheck).replaceAll('\\', '/'),
    /src\/drift\.ts/,
    'format:check did not identify the drifting file',
  );
  assert.equal(
    readFileSync(driftPath, 'utf8'),
    drift,
    'format:check modified source',
  );

  const writeResult = runPrettier('--write', '.');
  assert.equal(writeResult.status, 0, diagnostic(writeResult));
  const corrected = readFileSync(driftPath, 'utf8');
  assert.equal(corrected, 'export const drift = { value: 1 };\n');
  assert.equal(
    corrected.includes('\r\n'),
    false,
    'Prettier did not normalize source to LF',
  );

  const correctedCheck = runPrettier('--check', '.');
  assert.equal(correctedCheck.status, 0, diagnostic(correctedCheck));
  assert.equal(
    readFileSync(ignoredPath, 'utf8'),
    'export const ignored={value:1}\n',
    'Prettier modified ignored generated output',
  );

  console.log('Frontend formatting contract: PASS');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
