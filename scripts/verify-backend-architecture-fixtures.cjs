const assert = require('node:assert/strict');
const { validateProjectGraph } = require('./backend-architecture-policy.cjs');

function project(references = [], packages = []) {
  return { references, packages };
}

const clean = new Map([
  ['Proprium.Domain', project()],
  ['Proprium.Contracts.V1', project()],
  ['Proprium.Application', project(['Proprium.Domain'])],
  ['Proprium.Infrastructure', project(['Proprium.Application', 'Proprium.Domain'])],
  [
    'Proprium.Api',
    project(['Proprium.Application', 'Proprium.Infrastructure', 'Proprium.Contracts.V1']),
  ],
  ['Proprium.IntegrationTests', project(['Proprium.Api', 'Proprium.Infrastructure'])],
  [
    'Proprium.ArchitectureTests',
    project([
      'Proprium.Api',
      'Proprium.Application',
      'Proprium.Domain',
      'Proprium.Infrastructure',
      'Proprium.Contracts.V1',
      'Proprium.IntegrationTests',
    ]),
  ],
]);

assert.deepEqual(validateProjectGraph(clean), []);

const cases = [
  ['domain to infrastructure', 'Proprium.Domain', 'Proprium.Infrastructure', /Domain must not reference Proprium\.Infrastructure/],
  ['application to api', 'Proprium.Application', 'Proprium.Api', /Application must not reference Proprium\.Api/],
  ['infrastructure to api', 'Proprium.Infrastructure', 'Proprium.Api', /Infrastructure must not reference Proprium\.Api/],
  ['production to tests', 'Proprium.Api', 'Proprium.IntegrationTests', /production project must not reference test project/],
];

for (const [label, from, to, expected] of cases) {
  const fixture = new Map([...clean].map(([name, value]) => [name, project([...value.references], [...value.packages])]));
  fixture.get(from).references.push(to);
  assert.match(validateProjectGraph(fixture).join('\n'), expected, `${label} fixture was accepted.`);
}

const packageFixture = new Map([...clean].map(([name, value]) => [name, project([...value.references], [...value.packages])]));
packageFixture.get('Proprium.Domain').packages.push('Microsoft.EntityFrameworkCore');
assert.match(
  validateProjectGraph(packageFixture).join('\n'),
  /Domain must not reference implementation package Microsoft\.EntityFrameworkCore/,
);

const cycleFixture = new Map([...clean].map(([name, value]) => [name, project([...value.references], [...value.packages])]));
cycleFixture.get('Proprium.Domain').references.push('Proprium.Application');
assert.match(validateProjectGraph(cycleFixture).join('\n'), /Project reference cycle detected/);

const missingProjectFixture = new Map(clean);
missingProjectFixture.delete('Proprium.Contracts.V1');
assert.match(
  validateProjectGraph(missingProjectFixture).join('\n'),
  /Expected backend project Proprium\.Contracts\.V1 is missing/,
);

console.log('Backend architecture negative fixtures: PASS');
