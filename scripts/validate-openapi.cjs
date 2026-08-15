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
for (const endpoint of [
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/me',
]) {
  if (!document.paths?.[endpoint]) failures.push(`missing ${endpoint}`);
}
const sessionScheme = document.components?.securitySchemes?.PropriumSession;
if (
  sessionScheme?.type !== 'apiKey' ||
  sessionScheme?.in !== 'cookie' ||
  sessionScheme?.name !== '__Host-proprium_session'
) {
  failures.push('missing canonical PropriumSession cookie security scheme');
}
const currentUserSecurity = document.paths?.['/api/v1/auth/me']?.get?.security;
if (
  !Array.isArray(currentUserSecurity) ||
  !currentUserSecurity.some((requirement) =>
    Object.hasOwn(requirement, 'PropriumSession'),
  )
) {
  failures.push('current-user endpoint does not require PropriumSession');
}

if (failures.length) {
  console.error(`OpenAPI validation failed: ${failures.join('; ')}`);
  process.exit(1);
}

console.log('OpenAPI validation: PASS');
