#!/usr/bin/env node
const { validateChangeSets } = require('./change-set-policy.cjs');
const errors = validateChangeSets();
if (errors.length) {
  for (const error of errors) console.error(`Change-set validation: ${error}`);
  process.exit(1);
}
console.log('Change-set validation: PASS (Nuru records are durable and pre-commit traceable)');
