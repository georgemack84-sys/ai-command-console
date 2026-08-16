import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const disposableRoot = join(packageRoot, '.next');
mkdirSync(disposableRoot, { recursive: true });
const fixtureRoot = mkdtempSync(join(disposableRoot, 'dead-code-'));
const sourceRoot = join(fixtureRoot, 'src');
mkdirSync(sourceRoot);

const entrySource = "import { used } from './module';\nvoid used();\n";
const moduleSource =
  'export function used(): number { return 1; }\n' +
  'export function unusedExport(): number { return 2; }\n';
const unusedFileSource = 'export const unreachableFile = true;\n';

writeFileSync(
  join(fixtureRoot, 'package.json'),
  '{"name":"dead-code-fixture","private":true}\n',
);
writeFileSync(
  join(fixtureRoot, 'knip.json'),
  `${JSON.stringify(
    {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
      include: ['files', 'exports', 'types'],
    },
    null,
    2,
  )}\n`,
);
writeFileSync(join(sourceRoot, 'index.ts'), entrySource);
writeFileSync(join(sourceRoot, 'module.ts'), moduleSource);
writeFileSync(join(sourceRoot, 'unused-file.ts'), unusedFileSource);

try {
  const knipCli = join(packageRoot, 'node_modules', 'knip', 'bin', 'knip.js');
  const result = spawnSync(
    process.execPath,
    [
      knipCli,
      '--directory',
      fixtureRoot,
      '--reporter',
      'json',
      '--no-progress',
    ],
    { cwd: fixtureRoot, encoding: 'utf8' },
  );
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  assert.notEqual(result.status, 0, 'Knip accepted deliberate dead code.');

  const report = JSON.parse(result.stdout);
  const issues = report.issues ?? [];
  assert.equal(
    issues.some(
      ({ file, files }) =>
        file === 'src/unused-file.ts' &&
        files.some(({ name }) => name === 'src/unused-file.ts'),
    ),
    true,
    `Expected the unused-file fixture to fail.\n${output}`,
  );
  assert.equal(
    issues.some(
      ({ file, exports }) =>
        file === 'src/module.ts' &&
        exports.some(({ name }) => name === 'unusedExport'),
    ),
    true,
    `Expected the unused-export fixture to fail.\n${output}`,
  );
  assert.equal(readFileSync(join(sourceRoot, 'index.ts'), 'utf8'), entrySource);
  assert.equal(
    readFileSync(join(sourceRoot, 'module.ts'), 'utf8'),
    moduleSource,
  );
  assert.equal(
    readFileSync(join(sourceRoot, 'unused-file.ts'), 'utf8'),
    unusedFileSource,
  );

  console.log('Frontend dead-code enforcement contract: PASS');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
