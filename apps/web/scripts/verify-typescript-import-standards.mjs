import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const repositoryRoot = join(packageRoot, '..', '..');
const require = createRequire(import.meta.url);
const eslintCli = join(
  dirname(require.resolve('eslint/package.json')),
  'bin',
  'eslint.js',
);
const typeScriptCli = require.resolve('typescript/bin/tsc');
const requiredStrictness = [
  'strict',
  'strictNullChecks',
  'noImplicitAny',
  'noImplicitReturns',
  'noUncheckedIndexedAccess',
];

const disposableRoot = join(packageRoot, '.next');
mkdirSync(disposableRoot, { recursive: true });
const fixtureRoot = mkdtempSync(join(disposableRoot, 'typescript-imports-'));
const fixtureSourceRoot = join(fixtureRoot, 'src');
mkdirSync(fixtureSourceRoot);

function run(executable, arguments_, cwd = packageRoot) {
  return spawnSync(process.execPath, [executable, ...arguments_], {
    cwd,
    encoding: 'utf8',
  });
}

function output(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

function gitFiles(...patterns) {
  const result = spawnSync('git', ['ls-files', '-z', '--', ...patterns], {
    cwd: repositoryRoot,
    encoding: 'buffer',
  });
  assert.equal(
    result.status,
    0,
    'Unable to inspect tracked TypeScript policy.',
  );
  return result.stdout.toString('utf8').split('\0').filter(Boolean);
}

function verifyEffectiveCompilerPolicy() {
  const effective = run(typeScriptCli, [
    '--showConfig',
    '--project',
    'tsconfig.json',
  ]);
  assert.equal(effective.status, 0, output(effective));
  const { compilerOptions } = JSON.parse(effective.stdout);
  for (const option of requiredStrictness) {
    assert.equal(
      compilerOptions[option],
      true,
      `Effective TypeScript option ${option} must be true.`,
    );
  }
  assert.equal(
    compilerOptions.noEmit,
    true,
    'Canonical typecheck must not emit.',
  );

  for (const repositoryPath of gitFiles(
    '**/tsconfig*.json',
    'tsconfig*.json',
  )) {
    const contents = readFileSync(join(repositoryRoot, repositoryPath), 'utf8');
    for (const option of requiredStrictness) {
      assert.doesNotMatch(
        contents,
        new RegExp(`"${option}"\\s*:\\s*false`),
        `${repositoryPath} weakens ${option}.`,
      );
    }
  }
}

function verifyCompilerDirectives() {
  for (const repositoryPath of gitFiles(
    'apps/web/**/*.ts',
    'apps/web/**/*.tsx',
    'apps/web/**/*.mts',
    'apps/web/**/*.cts',
  )) {
    const absolutePath = join(repositoryRoot, repositoryPath);
    if (!existsSync(absolutePath)) continue;
    const lines = readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      assert.doesNotMatch(
        line,
        /@ts-(?:nocheck|ignore)\b/,
        `${repositoryPath}:${index + 1} uses a prohibited TypeScript directive.`,
      );
      if (!line.includes('@ts-expect-error')) continue;
      assert.match(
        line,
        /@ts-expect-error\s+\S.{2,}/,
        `${repositoryPath}:${index + 1} must explain @ts-expect-error.`,
      );
    }
  }
}

function verifyStrictnessFailures() {
  const configPath = join(fixtureRoot, 'tsconfig.json');
  const baseConfig = relative(
    fixtureRoot,
    join(packageRoot, 'tsconfig.json'),
  ).replaceAll('\\', '/');
  writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        extends: baseConfig,
        compilerOptions: { incremental: false, plugins: [] },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(fixtureSourceRoot, 'strictness.ts'),
    `function implicit(value) {
  return value;
}

function incomplete(flag: boolean) {
  if (flag) return 'ready';
}

const values: string[] = [];
const indexed: string = values[0];
const nullable: string = undefined;
void [implicit, incomplete, indexed, nullable];
`,
  );

  const result = run(
    typeScriptCli,
    ['--project', configPath, '--pretty', 'false'],
    fixtureRoot,
  );
  assert.notEqual(
    result.status,
    0,
    'Strict TypeScript accepted invalid fixtures.',
  );
  const diagnostics = output(result).replaceAll('\\', '/');
  for (const code of ['TS7006', 'TS7030', 'TS2322']) {
    assert.match(diagnostics, new RegExp(code), `Expected ${code} diagnostic.`);
  }
  assert.match(
    diagnostics,
    /strictness\.ts\(10,7\): error TS2322/,
    'Unchecked indexing did not fail.',
  );
  assert.match(
    diagnostics,
    /strictness\.ts\(11,7\): error TS2322/,
    'Strict nullability did not fail.',
  );
}

const fixtureConfigPath = join(fixtureRoot, 'eslint.config.mjs');
writeFileSync(
  fixtureConfigPath,
  `import baseConfig from ${JSON.stringify(pathToFileURL(join(packageRoot, 'eslint.config.mjs')).href)};

export default baseConfig;
`,
);

function lint(path, fix = false) {
  return run(
    eslintCli,
    [
      '--config',
      fixtureConfigPath,
      '--no-ignore',
      '--format',
      'json',
      ...(fix ? ['--fix'] : []),
      relative(fixtureRoot, path),
    ],
    fixtureRoot,
  );
}

function verifyImportPolicy() {
  const sortablePath = join(fixtureSourceRoot, 'sortable.mjs');
  writeFileSync(
    sortablePath,
    `import { zeta } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import { zed } from '@/zeta';
import { alpha } from '@/alpha';
import { parent } from '../parent';
import { siblingZ } from './zeta';
import { siblingA } from './alpha';

void [alpha, fs, parent, path, siblingA, siblingZ, zed, zeta];
`,
  );
  const invalid = lint(sortablePath);
  assert.notEqual(invalid.status, 0, 'ESLint accepted misordered imports.');
  const report = JSON.parse(invalid.stdout)[0];
  assert.ok(
    report.messages.filter(({ ruleId }) => ruleId === 'import/order').length >=
      3,
    output(invalid),
  );

  const fixed = lint(sortablePath, true);
  assert.equal(fixed.status, 0, output(fixed));
  assert.equal(
    readFileSync(sortablePath, 'utf8'),
    `import fs from 'node:fs';
import path from 'node:path';

import { zeta } from 'zod';

import { alpha } from '@/alpha';
import { zed } from '@/zeta';

import { parent } from '../parent';

import { siblingA } from './alpha';
import { siblingZ } from './zeta';

void [alpha, fs, parent, path, siblingA, siblingZ, zed, zeta];
`,
    'ESLint did not converge to the canonical import order.',
  );

  const sideEffectPath = join(fixtureSourceRoot, 'side-effect.mjs');
  const sideEffectSource = `import './register';
import { value } from './value';

void value;
`;
  writeFileSync(sideEffectPath, sideEffectSource);
  const sideEffect = lint(sideEffectPath);
  assert.notEqual(
    sideEffect.status,
    0,
    'ESLint accepted a side-effect import before an assigned import.',
  );
  assert.equal(
    JSON.parse(sideEffect.stdout)[0].messages.some(
      ({ ruleId }) => ruleId === 'no-restricted-syntax',
    ),
    true,
    output(sideEffect),
  );
  assert.equal(
    readFileSync(sideEffectPath, 'utf8'),
    sideEffectSource,
    'Canonical lint moved an order-sensitive side-effect import.',
  );

  const stylePath = join(fixtureSourceRoot, 'style-side-effect.mjs');
  const styleSource = `import './register';
import './styles.css';
`;
  writeFileSync(stylePath, styleSource);
  const style = lint(stylePath);
  assert.notEqual(
    style.status,
    0,
    'ESLint accepted a stylesheet after a runtime side-effect import.',
  );
  assert.equal(
    JSON.parse(style.stdout)[0].messages.some(
      ({ ruleId }) => ruleId === 'no-restricted-syntax',
    ),
    true,
    output(style),
  );
  assert.equal(
    readFileSync(stylePath, 'utf8'),
    styleSource,
    'Canonical lint reordered side-effect imports.',
  );
}

try {
  verifyEffectiveCompilerPolicy();
  verifyCompilerDirectives();
  verifyStrictnessFailures();
  verifyImportPolicy();
  console.log('TypeScript strictness and import standards: PASS');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
