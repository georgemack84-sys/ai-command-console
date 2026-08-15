#!/usr/bin/env node

const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const {
  validateBackendAuthenticationCore,
} = require('./backend-authentication-core-policy.cjs');

const repositoryRoot = join(__dirname, '..');
const requiredFiles = [
  'services/api/Proprium.Application/Authentication/AuthenticationContracts.cs',
  'services/api/Proprium.Domain/Identity/IdentityEntities.cs',
  'services/api/Proprium.Domain/Identity/SessionFactory.cs',
  'services/api/Proprium.Domain/Identity/SessionTokenDigest.cs',
  'services/api/Proprium.Infrastructure/Authentication/UserPasswordHasher.cs',
  'services/api/Proprium.Infrastructure/Authentication/SessionTokenGenerator.cs',
  'services/api/Proprium.Infrastructure/Authentication/PostgresAuthenticationService.cs',
  'services/api/Proprium.Infrastructure/Authentication/PostgresSessionService.cs',
  'services/api/Proprium.Infrastructure/Persistence/PostgresSessionRepository.cs',
  'services/api/Proprium.Infrastructure/Persistence/PropriumDbContext.cs',
  'services/api/Proprium.Api/Security/PropriumSessionAuthenticationHandler.cs',
  'services/api/Proprium.Api/Endpoints/AuthenticationEndpoints.cs',
  'services/api/Proprium.Api/Configuration/AuthenticationCookiePolicy.cs',
  'services/api/Proprium.Api/Configuration/AuthenticationRequestPolicy.cs',
  'services/api/Proprium.Api/OpenApi/CookieAuthenticationOperationFilter.cs',
  'services/api/Proprium.IntegrationTests/AuthenticationApiIntegrationTests.cs',
  'services/api/Proprium.IntegrationTests/SessionLifecycleIntegrationTests.cs',
  'services/api/Proprium.IntegrationTests/PlatformApiTests.cs',
  'docs/architecture/authentication-and-session-design.md',
  'docs/engineering/gp-26-backend-authentication-core.md',
  'docs/validation/week-3/gp-26-backend-authentication-core.md',
];
const read = (path) =>
  existsSync(join(repositoryRoot, path))
    ? readFileSync(join(repositoryRoot, path), 'utf8')
    : '';
const integrationTests = [
  'services/api/Proprium.IntegrationTests/AuthenticationApiIntegrationTests.cs',
  'services/api/Proprium.IntegrationTests/SessionLifecycleIntegrationTests.cs',
  'services/api/Proprium.IntegrationTests/PlatformApiTests.cs',
]
  .map(read)
  .join('\n');
const errors = [
  ...requiredFiles
    .filter((path) => !existsSync(join(repositoryRoot, path)))
    .map((path) => `${path}: required GP-26 artifact is missing`),
  ...validateBackendAuthenticationCore({
    contracts: read(
      'services/api/Proprium.Application/Authentication/AuthenticationContracts.cs',
    ),
    entities: read('services/api/Proprium.Domain/Identity/IdentityEntities.cs'),
    passwordHasher: read(
      'services/api/Proprium.Infrastructure/Authentication/UserPasswordHasher.cs',
    ),
    authenticationService: read(
      'services/api/Proprium.Infrastructure/Authentication/PostgresAuthenticationService.cs',
    ),
    tokenGenerator: read(
      'services/api/Proprium.Infrastructure/Authentication/SessionTokenGenerator.cs',
    ),
    tokenDigest: read(
      'services/api/Proprium.Domain/Identity/SessionTokenDigest.cs',
    ),
    sessionService: read(
      'services/api/Proprium.Infrastructure/Authentication/PostgresSessionService.cs',
    ),
    sessionRepository: read(
      'services/api/Proprium.Infrastructure/Persistence/PostgresSessionRepository.cs',
    ),
    database: read(
      'services/api/Proprium.Infrastructure/Persistence/PropriumDbContext.cs',
    ),
    handler: read(
      'services/api/Proprium.Api/Security/PropriumSessionAuthenticationHandler.cs',
    ),
    endpoints: read(
      'services/api/Proprium.Api/Endpoints/AuthenticationEndpoints.cs',
    ),
    cookiePolicy: read(
      'services/api/Proprium.Api/Configuration/AuthenticationCookiePolicy.cs',
    ),
    requestPolicy: read(
      'services/api/Proprium.Api/Configuration/AuthenticationRequestPolicy.cs',
    ),
    program: read('services/api/Proprium.Api/Program.cs'),
    operationFilter: read(
      'services/api/Proprium.Api/OpenApi/CookieAuthenticationOperationFilter.cs',
    ),
    openApiValidator: read('scripts/validate-openapi.cjs'),
    integrationTests,
    documentation: read(
      'docs/engineering/gp-26-backend-authentication-core.md',
    ),
  }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Backend authentication core failure: ${error}`);
  process.exit(1);
}
console.log(
  `Backend authentication core: PASS (${requiredFiles.length} artifacts, credential verification, opaque sessions, HTTP policy, OpenAPI, and evidence)`,
);
