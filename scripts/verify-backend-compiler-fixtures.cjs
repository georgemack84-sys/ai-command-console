const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
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
  ['null-assignment', 'NullAssignment.csproj', 'CS8600'],
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

for (const [property, value, message] of [
  ['Nullable', 'disable', 'Nullable=enable'],
  ['TreatWarningsAsErrors', 'false', 'TreatWarningsAsErrors=true'],
  ['EnableNETAnalyzers', 'false', 'EnableNETAnalyzers=true'],
  ['AnalysisLevel', 'none', 'AnalysisLevel=8.0'],
  ['AnalysisMode', 'All', 'AnalysisMode=Default'],
  ['EnforceCodeStyleInBuild', 'false', 'EnforceCodeStyleInBuild=true'],
  ['GenerateDocumentationFile', 'false', 'GenerateDocumentationFile=true'],
  ['Deterministic', 'false', 'Deterministic=true'],
]) {
  const policyOverride = build(
    'policy-enforcement',
    'PolicyEnforcement.csproj',
    [`-p:${property}=${value}`],
  );
  assert.notEqual(
    policyOverride.status,
    0,
    `${property}=${value} unexpectedly compiled successfully.`,
  );
  assert.match(
    output(policyOverride),
    new RegExp(`Proprium compiler policy requires ${message.replace('.', '\\.')}`),
    `The evaluated policy target did not reject ${property}=${value}.`,
  );
}

const nullableDisableFixture = mkdtempSync(
  join(fixtureRoot, 'nullable-disable-'),
);
const nullableDisableSource = join(nullableDisableFixture, 'Program.cs');
const nullableDisableContent =
  '#nullable disable\nstring value = null;\nConsole.WriteLine(value);\n';
try {
  writeFileSync(nullableDisableSource, nullableDisableContent);
  const nullableDisable = spawnSync(
    process.execPath,
    [join(repositoryRoot, 'scripts', 'validate-backend-compiler.cjs')],
    { cwd: repositoryRoot, encoding: 'utf8' },
  );
  assert.notEqual(
    nullableDisable.status,
    0,
    'The compiler policy accepted a handwritten #nullable disable directive.',
  );
  assert.match(
    output(nullableDisable),
    /disables nullable analysis/,
    'The compiler policy did not identify #nullable disable.',
  );
  assert.equal(
    readFileSync(nullableDisableSource, 'utf8'),
    nullableDisableContent,
    'Nullable policy verification mutated its fixture.',
  );
} finally {
  rmSync(nullableDisableFixture, { recursive: true, force: true });
}

console.log('Expected backend compiler and analyzer violations were detected.');
