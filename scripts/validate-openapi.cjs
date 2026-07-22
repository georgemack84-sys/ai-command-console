#!/usr/bin/env node

const fs = require('node:fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-openapi.cjs <openapi-file>');
  process.exit(1);
}

let document;
try {
  document = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`OpenAPI document is not valid JSON: ${error.message}`);
  process.exit(1);
}

const failures = [];
if (!String(document.openapi ?? '').startsWith('3.')) failures.push('missing OpenAPI 3.x version');
if (document.info?.title !== 'Proprium API') failures.push('unexpected document title');
if (document.info?.version !== 'v1') failures.push('unexpected document version');
if (!document.paths?.['/api/v1/health/live']) failures.push('missing liveness endpoint');

if (failures.length) {
  console.error(`OpenAPI validation failed: ${failures.join('; ')}`);
  process.exit(1);
}

console.log('OpenAPI validation: PASS');
