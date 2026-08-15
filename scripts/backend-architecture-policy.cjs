const { readFileSync, readdirSync } = require('node:fs');
const { basename, join } = require('node:path');

const productionProjects = new Set([
  'Proprium.Api',
  'Proprium.Application',
  'Proprium.Contracts.V1',
  'Proprium.Domain',
  'Proprium.Infrastructure',
]);

const allowedReferences = new Map([
  ['Proprium.Api', new Set(['Proprium.Application', 'Proprium.Contracts.V1', 'Proprium.Infrastructure'])],
  ['Proprium.Application', new Set(['Proprium.Domain'])],
  ['Proprium.Contracts.V1', new Set()],
  ['Proprium.Domain', new Set()],
  ['Proprium.Infrastructure', new Set(['Proprium.Application', 'Proprium.Domain'])],
  ['Proprium.IntegrationTests', new Set(['Proprium.Api', 'Proprium.Infrastructure'])],
  [
    'Proprium.ArchitectureTests',
    new Set([
      'Proprium.Api',
      'Proprium.Application',
      'Proprium.Contracts.V1',
      'Proprium.Domain',
      'Proprium.Infrastructure',
      'Proprium.IntegrationTests',
    ]),
  ],
]);

const forbiddenPackages = new Map([
  [
    'Proprium.Domain',
    /^(Microsoft\.AspNetCore|Microsoft\.EntityFrameworkCore|Npgsql|StackExchange\.Redis)/,
  ],
  [
    'Proprium.Application',
    /^(Microsoft\.AspNetCore|Microsoft\.EntityFrameworkCore|Npgsql|StackExchange\.Redis)/,
  ],
  [
    'Proprium.Contracts.V1',
    /^(Microsoft\.AspNetCore|Microsoft\.EntityFrameworkCore|Npgsql|StackExchange\.Redis)/,
  ],
]);

function projectName(reference) {
  return basename(reference.replaceAll('\\', '/'), '.csproj');
}

function includes(content, element) {
  return [...content.matchAll(new RegExp(`<${element}\\s+Include="([^"]+)"`, 'g'))].map(
    (match) => match[1],
  );
}

function readProjects(backendRoot) {
  const projects = new Map();
  for (const entry of readdirSync(backendRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('Proprium.')) continue;
    const path = join(backendRoot, entry.name, `${entry.name}.csproj`);
    let content;
    try {
      content = readFileSync(path, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    projects.set(entry.name, {
      packages: includes(content, 'PackageReference'),
      references: includes(content, 'ProjectReference').map(projectName),
    });
  }
  return projects;
}

function validateProjectGraph(projects) {
  const violations = [];

  for (const expected of allowedReferences.keys()) {
    if (!projects.has(expected)) violations.push(`Expected backend project ${expected} is missing.`);
  }

  for (const [name, project] of projects) {
    const allowed = allowedReferences.get(name);
    if (!allowed) {
      violations.push(`Unknown backend project ${name} has no architecture policy.`);
      continue;
    }
    for (const reference of project.references) {
      if (!allowed.has(reference)) {
        violations.push(`${name} must not reference ${reference}.`);
      }
      if (productionProjects.has(name) && /Tests$/.test(reference)) {
        violations.push(`${name} production project must not reference test project ${reference}.`);
      }
    }
    const forbidden = forbiddenPackages.get(name);
    if (forbidden) {
      for (const packageName of project.packages) {
        if (forbidden.test(packageName)) {
          violations.push(`${name} must not reference implementation package ${packageName}.`);
        }
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(name, path) {
    if (visiting.has(name)) {
      violations.push(`Project reference cycle detected: ${[...path, name].join(' -> ')}.`);
      return;
    }
    if (visited.has(name) || !projects.has(name)) return;
    visiting.add(name);
    for (const reference of projects.get(name).references) visit(reference, [...path, name]);
    visiting.delete(name);
    visited.add(name);
  }
  for (const name of projects.keys()) visit(name, []);

  return [...new Set(violations)].sort();
}

module.exports = { readProjects, validateProjectGraph };
