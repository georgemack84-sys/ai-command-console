const assert = require('node:assert/strict');
const {
  applyExceptions,
  validateConfigurationAuthority,
  validateDotnetProjects,
  validateJson,
  validateJsonSchema,
  validateMarkdown,
  validatePackageManager,
  validateRequiredFiles,
  validateSolutionCoverage,
  validateTrackedPaths,
  validateYaml,
  validationResult,
  validateExceptionRegistry,
} = require('./repository-validation-policy.cjs');

function ids(violations) {
  return violations.map((violation) => violation.id);
}

const required = ['.editorconfig', '.gitattributes'];
const validPaths = new Set(required);
assert.deepEqual(validateRequiredFiles(required, validPaths, validPaths), []);
assert.deepEqual(validateTrackedPaths(['src/index.ts']), []);
assert.deepEqual(
  validationResult('RVAL-MD-004', 'docs/index.md:12', 'fixture problem', 'fixture resolution'),
  {
    id: 'RVAL-MD-004',
    category: 'markdown',
    severity: 'error',
    file: 'docs/index.md',
    location: { line: 12, column: null },
    path: 'docs/index.md:12',
    problem: 'fixture problem',
    expected: 'fixture resolution',
  },
);
assert.deepEqual(validateJson('package.json', '{"name":"fixture"}\n'), []);
assert.deepEqual(validateJson('tsconfig.json', '{"compilerOptions":{/* JSONC */}}\n'), []);
const fixtureSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: { name: { type: 'string', minLength: 1 }, enabled: { type: 'boolean' } },
};
assert.deepEqual(validateJsonSchema({ name: 'fixture', enabled: true }, fixtureSchema, 'fixtures/valid.json'), []);
const fixtureException = { ruleId: 'RVAL-MD-004', path: 'docs/index.md', owner: 'proprium-maintainers', reason: 'Fixture exception.', expiresOn: '2099-01-01' };
assert.deepEqual(validateExceptionRegistry([fixtureException], '2026-09-06'), []);
assert.deepEqual(
  applyExceptions([validationResult('RVAL-MD-004', 'docs/index.md:12', 'fixture problem', 'fixture resolution')], [fixtureException], '2026-09-06').remaining,
  [],
);
assert.deepEqual(validateYaml('workflow.yml', 'name: fixture\nsteps:\n  - run: test\n'), []);
assert.deepEqual(validateMarkdown('docs/index.md', '# Fixture\n\n[Setup](setup.md)\n', (path) => path === 'docs/setup.md'), []);
assert.deepEqual(
  validateMarkdown(
    'docs/index.md',
    '# Fixture\n\n[Setup](setup.md#install)\n',
    (path) => path === 'docs/setup.md',
    () => '# Install\n',
  ),
  [],
);
assert.deepEqual(
  validateMarkdown('docs/index.md', '# Fixture\n\n[Again](#fixture-1)\n## Fixture\n'),
  [],
);
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
assert.deepEqual(ids(validateJsonSchema({ enabled: true }, fixtureSchema, 'fixtures/missing.json')), ['RVAL-SCHEMA-001']);
assert.deepEqual(ids(validateJsonSchema({ name: 'fixture', extra: true }, fixtureSchema, 'fixtures/extra.json')), ['RVAL-SCHEMA-001']);
assert.deepEqual(ids(validateExceptionRegistry([{ ...fixtureException, expiresOn: '2026-09-06' }], '2026-09-06')), ['RVAL-EXCEPTION-003']);
assert.deepEqual(ids(applyExceptions([], [fixtureException], '2026-09-06').unused), ['RVAL-EXCEPTION-004']);
assert.deepEqual(ids(validateYaml('workflow.yml', 'steps: [\n')), ['RVAL-YAML-001']);
assert.deepEqual(ids(validateMarkdown('docs/index.md', '# Fixture\n```text\nunclosed\n')), ['RVAL-MD-001']);
assert.deepEqual(
  ids(validateMarkdown('docs/index.md', '# Fixture\n[Missing](missing.md)\n', () => false)),
  ['RVAL-MD-003'],
);
assert.deepEqual(
  ids(validateMarkdown('docs/index.md', '# Fixture\n[Missing](#not-here)\n')),
  ['RVAL-MD-004'],
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
