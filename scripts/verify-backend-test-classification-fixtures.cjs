const assert = require('node:assert/strict');
const { validateTestProjects } = require('./backend-test-classification-policy.cjs');

function project(packages = []) {
  return { packages, references: [] };
}

const clean = new Map([
  ['Proprium.ArchitectureTests', project(['Microsoft.NET.Test.Sdk', 'xunit'])],
  ['Proprium.IntegrationTests', project(['Microsoft.NET.Test.Sdk', 'xunit', 'Npgsql.EntityFrameworkCore.PostgreSQL'])],
]);

assert.deepEqual(validateTestProjects(clean), []);

const unknownProject = new Map(clean);
unknownProject.set('Proprium.ComponentTests', project(['Microsoft.NET.Test.Sdk', 'xunit']));
assert.match(validateTestProjects(unknownProject).join('\n'), /has no classification policy/);

const infrastructurePackage = new Map(clean);
infrastructurePackage.set(
  'Proprium.ArchitectureTests',
  project(['Microsoft.NET.Test.Sdk', 'xunit', 'StackExchange.Redis']),
);
assert.match(validateTestProjects(infrastructurePackage).join('\n'), /must not directly reference infrastructure package/);

const missingFramework = new Map(clean);
missingFramework.set('Proprium.IntegrationTests', project(['Microsoft.NET.Test.Sdk']));
assert.match(validateTestProjects(missingFramework).join('\n'), /must reference xunit/);

console.log('Backend test classification metadata fixtures: PASS');
