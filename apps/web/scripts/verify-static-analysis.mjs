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
const require = createRequire(import.meta.url);
const eslintCli = join(
  dirname(require.resolve('eslint/package.json')),
  'bin',
  'eslint.js',
);
const typeScriptCli = require.resolve('typescript/bin/tsc');
const disposableRoot = join(packageRoot, '.next');
mkdirSync(disposableRoot, { recursive: true });
const fixtureRoot = mkdtempSync(join(disposableRoot, 'static-analysis-'));
const fixtureSourceRoot = join(fixtureRoot, 'src');
mkdirSync(fixtureSourceRoot);

const fixtureConfigPath = join(fixtureRoot, 'eslint.config.mjs');
writeFileSync(
  fixtureConfigPath,
  `import baseConfig from ${JSON.stringify(pathToFileURL(join(packageRoot, 'eslint.config.mjs')).href)};

export default [
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['src/*.{ts,tsx}'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
`,
);

function run(executable, arguments_, cwd = packageRoot) {
  return spawnSync(process.execPath, [executable, ...arguments_], {
    cwd,
    encoding: 'utf8',
  });
}

function output(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

function lint(paths) {
  return run(
    eslintCli,
    [
      '--config',
      fixtureConfigPath,
      '--no-ignore',
      '--format',
      'json',
      '--max-warnings',
      '0',
      '--report-unused-disable-directives',
      '--report-unused-inline-configs',
      'error',
      ...paths.map((path) => relative(fixtureRoot, path)),
    ],
    fixtureRoot,
  );
}

function lintReport(result, path) {
  const expectedPath = relative(fixtureRoot, path).replaceAll('\\', '/');
  return JSON.parse(result.stdout).find(
    ({ filePath }) =>
      relative(fixtureRoot, filePath).replaceAll('\\', '/') === expectedPath,
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

  const cleanPath = join(fixtureSourceRoot, 'clean.ts');
  writeFileSync(
    cleanPath,
    'export function intentional(_unused: string): number { return 1; }\n',
  );

  const invalidPath = join(fixtureSourceRoot, 'invalid.tsx');
  const invalidSource = `import { useEffect } from 'react';
import { readFile } from 'node:fs';
import { useState } from 'react';
import { URL } from 'node:url';

async function save(): Promise<void> {}
save();
let target: URL | undefined;
void target;

export function InvalidHook({ enabled }: { enabled: boolean }) {
  if (enabled) useState(0);
  const [dependency] = useState(1);
  const value: any = 1;
  const unused = 1;
  useEffect(() => console.error(dependency), []);
  debugger;
  return null;
}

export function unreachable(): number {
  return 1;
  console.error('never');
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
    'no-unreachable',
    'react-hooks/exhaustive-deps',
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

  const warningPath = join(fixtureSourceRoot, 'next-warning.tsx');
  writeFileSync(
    warningPath,
    "export function ImageFixture() { return <img src='/logo.png' alt='logo' />; }\n",
  );
  const warningFixture = lint([warningPath]);
  assert.notEqual(
    warningFixture.status,
    0,
    'Canonical lint accepted a warning despite --max-warnings 0.',
  );
  const warningReport = lintReport(warningFixture, warningPath);
  assert.ok(warningReport, 'ESLint omitted the Next.js warning fixture.');
  assert.equal(warningReport.errorCount, 0, output(warningFixture));
  assert.ok(warningReport.warningCount > 0, output(warningFixture));
  assert.equal(
    warningReport.messages.some(
      ({ ruleId, severity }) =>
        ruleId === '@next/next/no-img-element' && severity === 1,
    ),
    true,
    'Next.js lint rules did not produce the expected warning.',
  );

  const typeErrorPath = join(fixtureSourceRoot, 'type-error.ts');
  writeFileSync(typeErrorPath, "const port: number = '3000';\nvoid port;\n");
  const typeError = run(
    typeScriptCli,
    [
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
      relative(fixtureRoot, typeErrorPath),
    ],
    fixtureRoot,
  );
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
