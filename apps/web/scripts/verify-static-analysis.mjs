import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');
const require = createRequire(import.meta.url);
const eslintCli = join(
  dirname(require.resolve('eslint/package.json')),
  'bin',
  'eslint.js',
);
const typeScriptCli = require.resolve('typescript/bin/tsc');
const fixtureRoot = mkdtempSync(join(packageRoot, 'src', 'static-analysis-'));

function run(executable, arguments_) {
  return spawnSync(process.execPath, [executable, ...arguments_], {
    cwd: packageRoot,
    encoding: 'utf8',
  });
}

function output(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

function lint(paths) {
  return run(eslintCli, [
    '--format',
    'json',
    '--max-warnings',
    '0',
    '--report-unused-disable-directives',
    '--report-unused-inline-configs',
    'error',
    ...paths.map((path) => relative(packageRoot, path)),
  ]);
}

function lintReport(result, path) {
  const expectedPath = relative(packageRoot, path).replaceAll('\\', '/');
  return JSON.parse(result.stdout).find(
    ({ filePath }) =>
      relative(packageRoot, filePath).replaceAll('\\', '/') === expectedPath,
  );
}

function verifyRepositorySuppressions() {
  const suppressionMarker = ['eslint', 'disable'].join('-');
  const focusedSuppression = new RegExp(
    `${suppressionMarker}-(?:next-)?line\\s+[^-\\s][^]*?\\s--\\s\\S`,
  );
  const tracked = spawnSync(
    'git',
    [
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
      'apps/web',
    ],
    {
      cwd: join(packageRoot, '..', '..'),
      encoding: 'buffer',
    },
  );
  assert.equal(
    tracked.status,
    0,
    'Unable to inspect tracked frontend suppressions.',
  );

  const invalid = [];
  for (const repositoryPath of tracked.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)) {
    if (!/\.(?:[cm]?[jt]sx?)$/.test(repositoryPath)) continue;
    const absolutePath = join(packageRoot, '..', '..', repositoryPath);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const [index, line] of content.split(/\r?\n/).entries()) {
      if (!line.includes(suppressionMarker)) continue;
      if (!focusedSuppression.test(line))
        invalid.push(`${repositoryPath}:${index + 1}`);
    }
  }
  assert.deepEqual(
    invalid,
    [],
    `ESLint suppressions require a specific rule and justification: ${invalid.join(', ')}`,
  );
}

try {
  verifyRepositorySuppressions();

  const cleanPath = join(fixtureRoot, 'clean.ts');
  writeFileSync(
    cleanPath,
    'export function intentional(_unused: string): number { return 1; }\n',
  );

  const invalidPath = join(fixtureRoot, 'invalid.tsx');
  const invalidSource = `import { useMemo } from 'react';
import { readFile } from 'node:fs';
import { useState } from 'react';
import { URL } from 'node:url';

async function save(): Promise<void> {}
save();
let target: URL | undefined;
void target;

export function InvalidHook({ enabled }: { enabled: boolean }) {
  if (enabled) useState(0);
  const value: any = 1;
  const unused = useMemo(() => value, [value]);
  debugger;
  return null;
}
`;
  writeFileSync(invalidPath, invalidSource);
  const lintFixtures = lint([cleanPath, invalidPath]);
  assert.notEqual(
    lintFixtures.status,
    0,
    'ESLint accepted deliberately invalid source.',
  );
  const cleanReport = lintReport(lintFixtures, cleanPath);
  assert.ok(cleanReport, 'ESLint omitted the clean fixture from its report.');
  assert.deepEqual(cleanReport.messages, [], output(lintFixtures));
  assert.equal(
    readFileSync(invalidPath, 'utf8'),
    invalidSource,
    'Canonical lint mutated source.',
  );
  const invalidReport = lintReport(lintFixtures, invalidPath);
  assert.ok(
    invalidReport,
    'ESLint omitted the invalid fixture from its report.',
  );
  const rules = new Set(invalidReport.messages.map(({ ruleId }) => ruleId));
  for (const rule of [
    '@typescript-eslint/no-explicit-any',
    '@typescript-eslint/no-floating-promises',
    '@typescript-eslint/no-unused-vars',
    '@typescript-eslint/consistent-type-imports',
    'import/no-duplicates',
    'import/order',
    'no-debugger',
    'react-hooks/rules-of-hooks',
  ]) {
    assert.equal(
      rules.has(rule),
      true,
      `Expected fixture violation for ${rule}.`,
    );
  }
  const unusedCount = invalidReport.messages.filter(
    ({ ruleId }) => ruleId === '@typescript-eslint/no-unused-vars',
  ).length;
  assert.ok(
    unusedCount >= 2,
    'Expected unused import and variable violations.',
  );

  const typeErrorPath = join(fixtureRoot, 'type-error.ts');
  writeFileSync(typeErrorPath, "const port: number = '3000';\nvoid port;\n");
  const typeError = run(typeScriptCli, [
    '--noEmit',
    '--incremental',
    'false',
    '--strict',
    '--skipLibCheck',
    '--target',
    'ES2024',
    '--module',
    'esnext',
    '--moduleResolution',
    'bundler',
    relative(packageRoot, typeErrorPath),
  ]);
  assert.notEqual(
    typeError.status,
    0,
    'TypeScript accepted a deliberate type error.',
  );
  assert.match(
    output(typeError).replaceAll('\\', '/'),
    /type-error\.ts\(1,7\): error TS2322/,
  );

  console.log('Frontend static-analysis contract: PASS');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
