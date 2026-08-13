const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const fixtureRoot = join(
  repositoryRoot,
  'services',
  'api',
  'tests',
  'compiler-fixtures',
);
const cases = [
  ['nullable-dereference', 'NullableDereference.csproj', 'CS8602'],
  ['compiler-warning', 'CompilerWarning.csproj', 'CS1998'],
  ['analyzer-warning', 'AnalyzerWarning.csproj', 'CA2200'],
];

function build(directory, project, arguments_ = []) {
  return spawnSync(
    'dotnet',
    [
      'build',
      join(fixtureRoot, directory, project),
      '--configuration',
      'Release',
      '--nologo',
      '--verbosity',
      'minimal',
      ...arguments_,
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
}

function output(result) {
  return [result.stdout, result.stderr].filter(Boolean).join('\n');
}

for (const [directory, project, diagnostic] of cases) {
  const result = build(directory, project);
  assert.notEqual(
    result.status,
    0,
    `${directory} unexpectedly compiled successfully.`,
  );
  assert.match(
    output(result),
    new RegExp(`error ${diagnostic}:`),
    `${directory} did not fail with ${diagnostic}.`,
  );
}

const scopedSuppression = build('scoped-suppression', 'ScopedSuppression.csproj');
assert.notEqual(
  scopedSuppression.status,
  0,
  'Scoped suppression fixture unexpectedly compiled successfully.',
);
assert.match(
  output(scopedSuppression),
  /error CS8602:/,
  'Scoped suppression hid an unrelated nullable diagnostic.',
);
assert.doesNotMatch(
  output(scopedSuppression),
  /error CS1998:/,
  'Scoped suppression did not suppress only CS1998.',
);

const policyOverride = build('policy-enforcement', 'PolicyEnforcement.csproj', [
  '-p:Nullable=disable',
]);
assert.notEqual(
  policyOverride.status,
  0,
  'A compiler-policy override unexpectedly compiled successfully.',
);
assert.match(
  output(policyOverride),
  /Proprium compiler policy requires Nullable=enable\./,
  'The evaluated policy target did not reject Nullable=disable.',
);

console.log('Expected backend compiler and analyzer violations were detected.');
