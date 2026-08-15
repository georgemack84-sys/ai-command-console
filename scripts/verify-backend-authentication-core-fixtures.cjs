#!/usr/bin/env node

const assert = require('node:assert/strict');
const {
  validateBackendAuthenticationCore,
} = require('./backend-authentication-core-policy.cjs');

const valid = {
  contracts:
    'PasswordVerificationOutcome { Failed, Success, RehashNeeded } RawSessionToken ToString() => "[REDACTED]"',
  entities: 'Session { string TokenHash }',
  passwordHasher:
    'PasswordVerificationResult.Success PasswordVerificationResult.SuccessRehashNeeded',
  authenticationService:
    'DummyHash passwordHasher.Verify(new User(), DummyHash BeginTransactionAsync RehashNeeded SessionFactory.Create CommitAsync',
  tokenGenerator:
    "EntropyBytes = 32 RandomNumberGenerator.GetBytes TrimEnd('=') Replace('+', '-') Replace('/', '_')",
  tokenDigest: 'HMACSHA256.HashData',
  sessionService:
    'SessionValidationOutcome.Expired SessionValidationOutcome.Revoked SessionValidationOutcome.DisabledUser SessionValidationOutcome.SecurityVersionMismatch SessionValidationOutcome.Unavailable',
  sessionRepository:
    'FindByTokenHashAsync token => session.TokenHash == tokenHash.Value',
  database:
    'HasIndex(session => session.TokenHash).IsUnique() HasIndex(session => new { session.UserId, session.RevokedAtUtc, session.ExpiresAtUtc })',
  handler: 'sessions.ValidateAsync AuthenticateResult.Success',
  endpoints:
    'MapPost("/login" MapGet("/me" MapPost("/logout" SetNoStore(context) Status429TooManyRequests IsOriginAllowed IsCsrfAllowed',
  cookiePolicy:
    'HttpOnly = true Secure = environment.IsProduction() SameSite = SameSiteMode.Lax Path = "/" MaxAge = sessions.Value.Lifetime',
  requestPolicy:
    'HeaderName = "X-Proprium-CSRF" RequiredValue = "1"',
  program:
    'AddSecurityDefinition OperationFilter<CookieAuthenticationOperationFilter>',
  operationFilter: 'OfType<IAuthorizeData> OpenApiSecurityRequirement',
  openApiValidator:
    'PropriumSession current-user endpoint does not require PropriumSession',
  integrationTests:
    'Login_current_user_and_logout_use_authoritative_server_side_sessions Authentication_evidence_never_persists_raw_credentials_or_session_tokens Login_upgrades_an_outdated_password_hash_before_issuing_a_session Rehash_concurrency_failure_rolls_back_session_and_authentication_events Role_permission_change_rejects_an_existing_session Login_correctness_does_not_depend_on_redis Authentication_openapi_contract_declares_cookie_security_only_for_protected_operations',
  documentation:
    '## Password verification ## Session token contract ## Session validation ## HTTP and cookie contract ## Authentication events ## Validation',
};
const fixtures = [
  [
    'missing rehash outcome',
    { contracts: valid.contracts.replace('RehashNeeded', '') },
    'RehashNeeded',
  ],
  [
    'predictable token generator',
    {
      tokenGenerator: valid.tokenGenerator.replace(
        'RandomNumberGenerator.GetBytes',
        'Random.NextBytes',
      ),
    },
    'RandomNumberGenerator',
  ],
  [
    'raw token persistence',
    { entities: `${valid.entities} RawSessionToken RawToken` },
    'raw session token',
  ],
  [
    'missing security-version rejection',
    {
      sessionService: valid.sessionService.replace(
        'SessionValidationOutcome.SecurityVersionMismatch',
        '',
      ),
    },
    'SecurityVersionMismatch',
  ],
  [
    'redis session authority',
    { sessionService: `${valid.sessionService} RedisSessionCache` },
    'Redis appears',
  ],
  [
    'weakened csrf value',
    { requestPolicy: valid.requestPolicy.replace('RequiredValue = "1"', '') },
    'CSRF',
  ],
  [
    'missing protected OpenAPI scheme',
    { operationFilter: '' },
    'protected OpenAPI',
  ],
];

for (const [name, change, expected] of fixtures) {
  const errors = validateBackendAuthenticationCore({ ...valid, ...change });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join('; ')}`,
  );
}
console.log(
  `Backend authentication core controlled failures: PASS (${fixtures.length} rejected fixtures)`,
);
