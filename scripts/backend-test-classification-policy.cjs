const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const expectedTestProjects = new Set([
  'Proprium.ArchitectureTests',
  'Proprium.IntegrationTests',
]);

const forbiddenIndependentPackages = /^(Microsoft\.EntityFrameworkCore|Npgsql|StackExchange\.Redis|Testcontainers)(\.|$)/;

function readTestProjects(backendRoot) {
  const projects = new Map();
  for (const entry of readdirSync(backendRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith('Tests')) continue;
    const projectPath = join(backendRoot, entry.name, `${entry.name}.csproj`);
    let content;
    try {
      content = readFileSync(projectPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    projects.set(entry.name, {
      packages: [...content.matchAll(/<PackageReference\s+Include="([^"]+)"/g)].map((match) => match[1]),
    });
  }
  return projects;
}

function validateTestProjects(projects) {
  const violations = [];
  const actual = [...projects.keys()].filter((name) => name.endsWith('Tests'));

  for (const expected of expectedTestProjects) {
    if (!projects.has(expected)) violations.push(`Expected test project ${expected} is missing.`);
  }
  for (const name of actual) {
    if (!expectedTestProjects.has(name)) violations.push(`Test project ${name} has no classification policy.`);
  }

  const independent = projects.get('Proprium.ArchitectureTests');
  for (const packageName of independent?.packages ?? []) {
    if (forbiddenIndependentPackages.test(packageName)) {
      violations.push(`Proprium.ArchitectureTests must not directly reference infrastructure package ${packageName}.`);
    }
  }

  const integration = projects.get('Proprium.IntegrationTests');
  for (const required of ['Microsoft.NET.Test.Sdk', 'xunit']) {
    if (integration && !integration.packages.includes(required)) {
      violations.push(`Proprium.IntegrationTests must reference ${required}.`);
    }
  }

  return violations.sort();
}

module.exports = { readTestProjects, validateTestProjects };
