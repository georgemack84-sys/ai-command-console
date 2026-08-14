#!/usr/bin/env node

const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { commands } = require('./proprium-command.cjs');

const root = join(__dirname, '..');
const failures = [];
const requiredDocuments = [
  'README.md',
  'docs/onboarding/developer-setup.md',
  'docs/onboarding/configuration.md',
  'docs/onboarding/clean-machine-validation.md',
  'docs/engineering/repository-commands.md',
  'docs/operations/local-infrastructure.md',
  'docs/operations/migrations.md',
  'docs/operations/database-reset.md',
  'docs/operations/troubleshooting.md',
  'docs/validation/gp-16-clean-machine.md',
];

function read(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    failures.push(`${path}: required document is missing`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

function requireText(path, source, expected) {
  if (!source.includes(expected)) failures.push(`${path}: missing ${JSON.stringify(expected)}`);
}

for (const path of requiredDocuments) read(path);

const readme = read('README.md');
for (const target of [
  'docs/onboarding/developer-setup.md',
  'docs/engineering/repository-commands.md',
  'docs/operations/troubleshooting.md',
  'docs/onboarding/clean-machine-validation.md',
]) requireText('README.md', readme, target);

const reference = read('docs/engineering/repository-commands.md');
for (const command of commands.keys()) requireText('docs/engineering/repository-commands.md', reference, `repo -- ${command}`);
for (const command of ['doctor', 'bootstrap', 'dev', 'stop', 'migrate', 'health', 'reset-db']) {
  requireText('docs/engineering/repository-commands.md', reference, command);
}

const configuration = read('docs/onboarding/configuration.md');
for (const template of ['.env.example', 'apps/web/.env.example', 'services/api/.env.example']) {
  const content = readFileSync(join(root, template), 'utf8');
  const relevant = template === '.env.example' ? content.split('# Transitional root application contract.')[0] : content;
  for (const match of relevant.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) {
    requireText('docs/onboarding/configuration.md', configuration, `\`${match[1]}\``);
  }
}

const migration = read('docs/operations/migrations.md');
for (const expected of ['database-migrations', 'PropriumDbContext', '__EFMigrationsHistory', 'npm run repo -- migrate']) {
  requireText('docs/operations/migrations.md', migration, expected);
}

const reset = read('docs/operations/database-reset.md');
for (const expected of ['This operation destroys local development data.', 'reset-db --force', 'reset-db -Force']) {
  requireText('docs/operations/database-reset.md', reset, expected);
}

const cleanMachine = read('docs/onboarding/clean-machine-validation.md');
for (const expected of ['Clean clone', 'Clean machine', 'docs/validation/gp-16-clean-machine.md']) {
  requireText('docs/onboarding/clean-machine-validation.md', cleanMachine, expected);
}

const evidence = read('docs/validation/gp-16-clean-machine.md');
for (const expected of ['Repository tree', 'Commands executed', 'Recovery scenarios', 'CLEAN-MACHINE CERTIFICATION:']) {
  requireText('docs/validation/gp-16-clean-machine.md', evidence, expected);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`Documentation contract failure: ${failure}`);
  process.exit(1);
}

console.log(`Developer documentation contract: PASS (${requiredDocuments.length} authoritative documents)`);
