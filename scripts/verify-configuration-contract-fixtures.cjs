#!/usr/bin/env node

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { configurationContracts, validateTemplateContract } = require('./configuration-contract-policy.cjs');
const { validateConfigurationDocumentation } = require('./configuration-documentation-policy.cjs');
const { parseEnvironmentTemplate } = require('./environment-template-parser.cjs');

const validParserInput = '# comment\r\nFIRST=value\r\nEMPTY=\r\nHIERARCHICAL__KEY=value\r\n';
const parsed = parseEnvironmentTemplate(validParserInput, 'fixture.env.example');
assert.deepEqual(parsed.errors, []);
assert.deepEqual(parsed.entries.map(({ key }) => key), ['FIRST', 'EMPTY', 'HIERARCHICAL__KEY']);
assert.equal(parsed.comments.length, 1);

for (const malformed of ['KEY\n', '=value\n', 'lower=value\n', 'HAS SPACE=value\n', 'HAS-DASH=value\n']) {
  assert.equal(parseEnvironmentTemplate(malformed, 'fixture.env.example').errors[0].id, 'CONFIG-002');
}
for (const duplicate of ['KEY=one\nKEY=two\n', 'KEY=same\nKEY=same\n']) {
  const error = parseEnvironmentTemplate(duplicate, 'fixture.env.example').errors[0];
  assert.equal(error.id, 'CONFIG-004');
  assert.equal(error.line, 2);
  assert.equal(error.previousLine, 1);
}

const contractsById = new Map(configurationContracts.map((contract) => [contract.id, contract]));
const root = contractsById.get('root');
const rootContent = readFileSync(root.path, 'utf8').split('# Transitional root application contract.')[0];
assert.deepEqual(validateTemplateContract(root, rootContent), []);
assert.ok(validateTemplateContract(root, rootContent.replace('POSTGRES_DATABASE=proprium\n', '')).some(({ id }) => id === 'CONFIG-003'));
assert.ok(validateTemplateContract(root, rootContent.replace('API_PORT=8080', 'API_PORT=8080\nAPI_PORT=8080')).some(({ id }) => id === 'CONFIG-004'));

const web = contractsById.get('web');
const webContent = readFileSync(web.path, 'utf8');
assert.deepEqual(validateTemplateContract(web, webContent), []);
assert.ok(validateTemplateContract(web, webContent.replace('NEXT_PUBLIC_API_BASE_URL=http://localhost:8080\n', '')).some(({ id }) => id === 'CONFIG-003'));
assert.ok(validateTemplateContract(web, webContent.replace('http://localhost:8080', 'not-a-url')).some(({ id }) => id === 'CONFIG-006'));
const credentialUrl = ['https://fixture:', 'test-only-value', '@frontend.example'].join('');
assert.ok(validateTemplateContract(web, webContent.replace('http://localhost:8080', credentialUrl)).some(({ id }) => id === 'CONFIG-006'));
const publicPassword = ['NEXT_PUBLIC_POSTGRES_', 'PASSWORD'].join('');
assert.ok(validateTemplateContract(web, `${webContent}${publicPassword}=change-me\n`).some(({ id }) => id === 'CONFIG-006'));

const api = contractsById.get('api');
const apiContent = readFileSync(api.path, 'utf8');
assert.deepEqual(validateTemplateContract(api, apiContent), []);
assert.ok(validateTemplateContract(api, apiContent.replace('POSTGRES_DATABASE=proprium\n', '')).some(({ id }) => id === 'CONFIG-003'));
assert.ok(validateTemplateContract(api, apiContent.replace('REDIS_PORT=6379', 'REDIS_PORT=6379\nREDIS_PORT=6379')).some(({ id }) => id === 'CONFIG-004'));

const learningAgent = contractsById.get('learningAgent');
const learningAgentContent = readFileSync(learningAgent.path, 'utf8');
assert.deepEqual(validateTemplateContract(learningAgent, learningAgentContent), []);
assert.ok(validateTemplateContract(learningAgent, learningAgentContent.replace('NEXT_PUBLIC_LEARNING_API_ORIGIN=http://localhost:5050\n', '')).some(({ id }) => id === 'CONFIG-003'));
assert.ok(validateTemplateContract(learningAgent, learningAgentContent.replace('http://localhost:5050', 'not-a-url')).some(({ id }) => id === 'CONFIG-006'));
const learningAgentSecret = ['NEXT_PUBLIC_LEARNING_', 'TOKEN'].join('');
assert.ok(validateTemplateContract(learningAgent, `${learningAgentContent}${learningAgentSecret}=change-me\n`).some(({ id }) => id === 'CONFIG-006'));

const documentation = readFileSync('docs/onboarding/configuration.md', 'utf8');
assert.ok(validateConfigurationDocumentation(documentation.replace('| `NEXT_PUBLIC_APP_VERSION`', '| `REMOVED_PUBLIC_KEY`')).some(({ message }) => message.includes('NEXT_PUBLIC_APP_VERSION')));
assert.ok(validateConfigurationDocumentation(documentation.replace('| `NEXT_PUBLIC_APP_VERSION`', '| `STALE_PUBLIC_KEY`')).some(({ message }) => message.includes('stale or unowned')));

console.log('Configuration contract controlled failures: PASS (parser, keys, URL, ownership, and documentation drift)');
