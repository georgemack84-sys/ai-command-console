const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const fixtureRoot = mkdtempSync(
  join(repositoryRoot, '.codex-temp-backend-format-'),
);
const fixturePath = join(fixtureRoot, 'Fixture.cs');
const projectPath = join(fixtureRoot, 'FormattingFixture.csproj');
const invalidSource =
  'namespace FormattingFixture;\n\npublic static class Fixture\n{\n public static void Run()\n {\n if(true) {\n Console.WriteLine("fixture");\n } else {\n Console.WriteLine("other");\n }\n }\n}\n';

function format(verify = false) {
  const arguments_ = [
    'format',
    'whitespace',
    projectPath,
    '--no-restore',
    '--verbosity',
    'minimal',
  ];
  if (verify) arguments_.push('--verify-no-changes');
  return spawnSync('dotnet', arguments_, {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
}

try {
  writeFileSync(projectPath, '<Project Sdk="Microsoft.NET.Sdk" />\n');
  writeFileSync(fixturePath, invalidSource);

  const restore = spawnSync('dotnet', ['restore', projectPath, '--nologo'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(restore.status, 0, `${restore.stdout}\n${restore.stderr}`);

  const invalid = format(true);
  assert.notEqual(
    invalid.status,
    0,
    'Formatting verification accepted deliberate whitespace drift.',
  );
  assert.equal(
    readFileSync(fixturePath, 'utf8'),
    invalidSource,
    'Formatting verification mutated its fixture.',
  );

  const write = format();
  assert.equal(write.status, 0, `${write.stdout}\n${write.stderr}`);
  const formattedSource = readFileSync(fixturePath, 'utf8');
  assert.notEqual(
    formattedSource,
    invalidSource,
    'Write mode did not correct the formatting fixture.',
  );
  assert.match(
    formattedSource,
    /public static class Fixture\n\{[\s\S]*if \(true\)\n        \{[\s\S]*\n        else\n        \{/,
    'The repository brace, spacing, and newline policy was not applied.',
  );

  const clean = format(true);
  assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
  assert.equal(
    readFileSync(fixturePath, 'utf8'),
    formattedSource,
    'Verification mutated clean source.',
  );

  const secondWrite = format();
  assert.equal(
    secondWrite.status,
    0,
    `${secondWrite.stdout}\n${secondWrite.stderr}`,
  );
  assert.equal(
    readFileSync(fixturePath, 'utf8'),
    formattedSource,
    'Backend formatting is not idempotent.',
  );

  console.log('Backend formatting contract: PASS');
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
