#!/usr/bin/env node

const { validateOwnership } = require('./project-ownership-policy.cjs');

const errors = validateOwnership();
if (errors.length) {
  for (const error of errors) console.error(`Project ownership validation: ${error}`);
  process.exit(1);
}
console.log('Project ownership validation: PASS (Nuru, platform, generated, temporary, and unknown boundaries)');
