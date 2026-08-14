const assert = require('node:assert/strict');
const {
  validateConfigurationAuthority,
  validateDotnetProjects,
  validateJson,
  validateMarkdown,
  validatePackageManager,
  validateRequiredFiles,
  validateSolutionCoverage,
  validateTrackedPaths,
  validateYaml,
} = require('./repository-validation-policy.cjs');

function ids(violations) {
  return violations.map((violation) => violation.id);
}

const required = ['.editorconfig', '.gitattributes'];
const validPaths = new Set(required);
assert.deepEqual(validateRequiredFiles(required, validPaths, validPaths), []);
assert.deepEqual(validateTrackedPaths(['src/index.ts']), []);
assert.deepEqual(validateJson('package.json', '{"name":"fixture"}\n'), []);
assert.deepEqual(validateJson('tsconfig.json', '{"compilerOptions":{/* JSONC */}}\n'), []);
assert.deepEqual(validateYaml('workflow.yml', 'name: fixture\nsteps:\n  - run: test\n'), []);
assert.deepEqual(validateMarkdown('docs/index.md', '# Fixture\n\n[Setup](setup.md)\n', (path) => path === 'docs/setup.md'), []);
assert.deepEqual(validatePackageManager(['package-lock.json', 'apps/web/package-lock.json']), []);
assert.deepEqual(validateConfigurationAuthority(['.editorconfig', 'apps/web/.prettierrc.json']), []);
assert.deepEqual(validateDotnetProjects(new Map([['Valid.csproj', '<Project />']])), []);
assert.deepEqual(
  validateSolutionCoverage('Backend.sln', 'Project("type") = "Api", "Api/Api.csproj", "id"', ['services/api/Api/Api.csproj']),
  [],
);

assert.deepEqual(
  ids(validateRequiredFiles(required, new Set(['.gitattributes']), validPaths)),
  ['RVAL-FILE-001'],
);
assert.deepEqual(
  ids(validateRequiredFiles(required, validPaths, new Set(['.gitattributes']))),
  ['RVAL-FILE-002'],
);
assert.deepEqual(ids(validateTrackedPaths(['services/api/.env.local'])), ['RVAL-GIT-001']);
assert.deepEqual(ids(validateTrackedPaths(['services/api/bin/Debug/api.dll'])), ['RVAL-GIT-002']);
assert.deepEqual(ids(validateJson('package.json', '{"name":"fixture",}')), ['RVAL-JSON-001']);
assert.deepEqual(ids(validateYaml('workflow.yml', 'steps: [\n')), ['RVAL-YAML-001']);
assert.deepEqual(ids(validateMarkdown('docs/index.md', '# Fixture\n```text\nunclosed\n')), ['RVAL-MD-001']);
assert.deepEqual(
  ids(validateMarkdown('docs/index.md', '# Fixture\n[Missing](missing.md)\n', () => false)),
  ['RVAL-MD-003'],
);
assert.deepEqual(
  ids(validatePackageManager(['package-lock.json', 'apps/web/package-lock.json', 'pnpm-lock.yaml'])),
  ['RVAL-NODE-002'],
);
assert.deepEqual(ids(validateConfigurationAuthority(['.editorconfig', 'src/.editorconfig'])), ['RVAL-FILE-004']);
assert.deepEqual(
  ids(validateDotnetProjects(new Map([['Weak.csproj', '<Project><Nullable>disable</Nullable></Project>']]))),
  ['RVAL-DOTNET-001'],
);
assert.deepEqual(
  ids(validateSolutionCoverage('Backend.sln', 'Project("type") = "Api", "Api/Api.csproj", "id"', [
    'services/api/Api/Api.csproj',
    'services/api/Domain/Domain.csproj',
  ])),
  ['RVAL-DOTNET-002'],
);

console.log('Repository validation fixtures: PASS');
