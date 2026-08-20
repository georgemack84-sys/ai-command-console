const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const fixtureRoot = join(
  repositoryRoot,
  'services',
  'api',
  'tests',
  'analyzer-fixtures',
);

const formatterCases = [
  ['interface-naming', 'IDE1006'],
  ['async-naming', 'IDE1006'],
  ['constant-naming', 'IDE1006'],
  ['access-modifier', 'IDE0040'],
  ['namespace-style', 'IDE0161'],
  ['namespace-folder', 'IDE0130'],
  ['using-order', 'IMPORTS'],
];

function output(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

function assertOnlyDiagnostic(result, diagnostic, fixture) {
  const diagnostics = [
    ...output(result).matchAll(/error ([A-Z]+\d*|IMPORTS):/g),
  ].map((match) => match[1]);
  assert.deepEqual(
    [...new Set(diagnostics)],
    [diagnostic],
    `${fixture} produced diagnostics outside its intended ${diagnostic} contract.\n${output(result)}`,
  );
}

for (const [directory, diagnostic] of formatterCases) {
  const result = spawnSync(
    'dotnet',
    [
      'format',
      'style',
      join(fixtureRoot, directory, 'AnalyzerFixture.csproj'),
      '--verify-no-changes',
      '--severity',
      'error',
      '--verbosity',
      'minimal',
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  assert.notEqual(
    result.status,
    0,
    `${directory} unexpectedly compiled successfully.`,
  );
  assert.match(
    output(result),
    new RegExp(`error ${diagnostic}:`),
    `${directory} did not fail with ${diagnostic}.\n${output(result)}`,
  );
  assertOnlyDiagnostic(result, diagnostic, directory);
}

const unusedUsing = spawnSync(
  'dotnet',
  [
    'build',
    join(fixtureRoot, 'unused-using', 'AnalyzerFixture.csproj'),
    '--configuration',
    'Release',
    '--nologo',
    '--verbosity',
    'minimal',
  ],
  { cwd: repositoryRoot, encoding: 'utf8' },
);
assert.notEqual(
  unusedUsing.status,
  0,
  'unused-using unexpectedly passed formatter verification.',
);
assert.match(
  output(unusedUsing),
  /error IDE0005:/,
  `unused-using did not fail with IDE0005.\n${output(unusedUsing)}`,
);
assertOnlyDiagnostic(unusedUsing, 'IDE0005', 'unused-using');

const readonlyField = spawnSync(
  'dotnet',
  [
    'build',
    join(fixtureRoot, 'readonly-field', 'AnalyzerFixture.csproj'),
    '--configuration',
    'Release',
    '--nologo',
    '--verbosity',
    'minimal',
  ],
  { cwd: repositoryRoot, encoding: 'utf8' },
);
assert.notEqual(
  readonlyField.status,
  0,
  'readonly-field unexpectedly compiled successfully.',
);
assert.match(
  output(readonlyField),
  /error IDE0044:/,
  `readonly-field did not fail with IDE0044.\n${output(readonlyField)}`,
);
assertOnlyDiagnostic(readonlyField, 'IDE0044', 'readonly-field');

console.log('Expected backend analyzer and style violations were detected.');
