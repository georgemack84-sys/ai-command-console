import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  const ignoredPath = join(fixtureRoot, '.next', 'generated.js');
  writeFileSync(ignoredPath, 'export const ignored={value:1}\n');

  const driftFixtures = new Map([
    [
      'typescript.ts',
      [
        'export const typescript={value:1}\r\n',
        'export const typescript = { value: 1 };\n',
      ],
    ],
    [
      'javascript.js',
      [
        'export const javascript={value:1}\n',
        'export const javascript = { value: 1 };\n',
      ],
    ],
    [
      'module.mjs',
      [
        'export const module={value:1}\n',
        'export const module = { value: 1 };\n',
      ],
    ],
    [
      'commonjs.cjs',
      ['module.exports={value:1}\n', 'module.exports = { value: 1 };\n'],
    ],
    [
      'component.jsx',
      [
        'export const Component=()=> <div>ready</div>\n',
        'export const Component = () => <div>ready</div>;\n',
      ],
    ],
    [
      'typed-component.tsx',
      [
        'export const Typed=({value}:{value:string})=> <div>{value}</div>\n',
        'export const Typed = ({ value }: { value: string }) => <div>{value}</div>;\n',
      ],
    ],
    ['configuration.json', ['{"enabled":true}\n', '{ "enabled": true }\n']],
    ['guide.md', ['# Fixture\n\n-   ready\n', '# Fixture\n\n- ready\n']],
    ['workflow.yml', ['enabled:    true\n', 'enabled: true\n']],
    ['settings.yaml', ['mode:    strict\n', 'mode: strict\n']],
  ]);

  for (const [name, [drift]] of driftFixtures) {
    writeFileSync(join(fixtureRoot, 'src', name), drift);
  }

  const failingCheck = runPrettier('--check', '.');
  assert.notEqual(
    failingCheck.status,
    0,
    'format:check accepted deliberately misformatted source',
  );
  const failingDiagnostic = diagnostic(failingCheck).replaceAll('\\', '/');
  for (const [name, [drift]] of driftFixtures) {
    assert.match(
      failingDiagnostic,
      new RegExp(`src/${name.replace('.', '\\.')}`),
      `format:check did not identify ${name}`,
    );
    assert.equal(
      readFileSync(join(fixtureRoot, 'src', name), 'utf8'),
      drift,
      `format:check modified ${name}`,
    );
  }

  const writeResult = runPrettier('--write', '.');
  assert.equal(writeResult.status, 0, diagnostic(writeResult));
  for (const [name, [, expected]] of driftFixtures) {
    const corrected = readFileSync(join(fixtureRoot, 'src', name), 'utf8');
    assert.equal(corrected, expected, `Prettier did not correct ${name}`);
    assert.equal(
      corrected.includes('\r\n'),
      false,
      `Prettier did not normalize ${name} to LF`,
    );
  }

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
