#!/usr/bin/env node

const { readFileSync } = require('node:fs');
const { configurationContracts } = require('./configuration-contract-policy.cjs');
const { validateConfigurationDocumentation } = require('./configuration-documentation-policy.cjs');
const { parseEnvironmentTemplate } = require('./environment-template-parser.cjs');

const expectedById = new Map();
for (const contract of configurationContracts) {
  let content = readFileSync(contract.path, 'utf8');
  if (contract.id === 'root') content = content.split('# Transitional root application contract.')[0];
  const parsed = parseEnvironmentTemplate(content, contract.path);
  if (parsed.errors.length) {
    for (const error of parsed.errors) {
      console.error(`[${error.id}] ${error.path}:${error.line} ${error.message}`);
    }
    process.exit(1);
  }
  expectedById.set(contract.id, parsed.entries.map(({ key }) => key));
}

const documentation = readFileSync('docs/onboarding/configuration.md', 'utf8');
const errors = validateConfigurationDocumentation(documentation, expectedById);
if (errors.length) {
  for (const error of errors) console.error(`[${error.id}] ${error.path}: ${error.message}`);
  process.exit(1);
}

console.log('Configuration documentation synchronization: PASS (templates, ownership, guidance, and exact variable tables)');
