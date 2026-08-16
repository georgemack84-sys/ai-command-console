const { configurationContracts } = require('./configuration-contract-policy.cjs');

const requiredHeadings = [
  '## Template ownership',
  '## Local use',
  '## Configuration architecture',
  '## Resolution and precedence',
  '## Proprium inventory',
  '## Secret boundary',
  '## Build-time and runtime behavior',
  '## CI behavior',
  '## Future production configuration',
  '## Troubleshooting',
  '## Changing the configuration contract',
  '## Validation',
];

function section(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start < 0) return '';
  const nextHeading = markdown.indexOf('\n### ', start + heading.length);
  const nextSection = markdown.indexOf('\n## ', start + heading.length);
  const ends = [nextHeading, nextSection].filter((index) => index >= 0);
  return markdown.slice(start, ends.length ? Math.min(...ends) : markdown.length);
}

function tableKeys(markdown) {
  return [...markdown.matchAll(/^\|\s*`([A-Z][A-Z0-9_]*(?:__[A-Z][A-Z0-9_]*)*)`\s*\|/gm)]
    .map((match) => match[1]);
}

function issue(message) {
  return { id: 'CONFIG-011', path: 'docs/onboarding/configuration.md', message };
}

function validateConfigurationDocumentation(markdown, expectedById = new Map()) {
  const errors = [];
  for (const heading of requiredHeadings) {
    if (!markdown.includes(heading)) errors.push(issue(`missing required section ${heading}`));
  }
  for (const contract of configurationContracts) {
    const documented = tableKeys(section(markdown, contract.heading));
    const expected = expectedById.get(contract.id) ?? contract.keys;
    const documentedSet = new Set(documented);
    const expectedSet = new Set(expected);
    for (const key of expected) {
      if (!documentedSet.has(key)) {
        errors.push(issue(`${contract.heading} is missing variable ${key}`));
      }
    }
    for (const key of documented) {
      if (!expectedSet.has(key)) {
        errors.push(issue(`${contract.heading} contains stale or unowned variable ${key}`));
      }
    }
    if (!markdown.includes(`\`${contract.local}\``)) {
      errors.push(issue(`${contract.path} is missing local counterpart ${contract.local}`));
    }
  }
  for (const phrase of [
    'Lower entries override higher entries.',
    'Do not commit',
    'Every web value is required at build time, non-sensitive',
    '| Variable | Requirement | Sensitive | Type | Purpose |',
    '| Variable | Type | Purpose |',
    'PART II — QUALIFIED',
    'npm run repo -- validate configuration',
  ]) {
    if (!markdown.includes(phrase)) errors.push(issue(`missing required guidance: ${phrase}`));
  }
  return errors;
}

module.exports = {
  requiredHeadings,
  tableKeys,
  validateConfigurationDocumentation,
};
