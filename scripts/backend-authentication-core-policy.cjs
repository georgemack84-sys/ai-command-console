function requirePattern(errors, source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function rejectPattern(errors, source, pattern, message) {
  if (pattern.test(source)) errors.push(message);
}

function validateBackendAuthenticationCore(sources) {
  const errors = [];
  const {
    contracts,
    entities,
    passwordHasher,
    authenticationService,
    tokenGenerator,
    tokenDigest,
    sessionService,
    sessionRepository,
    database,
    handler,
    endpoints,
    cookiePolicy,
    requestPolicy,
    program,
    operationFilter,
    openApiValidator,
    integrationTests,
    documentation,
  } = sources;

  for (const outcome of ['Failed', 'Success', 'RehashNeeded']) {
    requirePattern(
      errors,
      contracts,
      new RegExp(`PasswordVerificationOutcome[^}]*\\b${outcome}\\b`),
      `password verification outcome ${outcome} is missing`,
    );
  }
  for (const frameworkOutcome of [
    'PasswordVerificationResult.Success',
    'PasswordVerificationResult.SuccessRehashNeeded',
  ]) {
    requirePattern(
      errors,
      passwordHasher,
      new RegExp(frameworkOutcome.replaceAll('.', '\\.')),
      `password wrapper does not map ${frameworkOutcome}`,
    );
  }
  requirePattern(
    errors,
    authenticationService,
    /DummyHash[\s\S]*passwordHasher\.Verify\(new User\(\), DummyHash/,
    'unknown-user login does not perform dummy password verification',
  );
  requirePattern(
    errors,
    authenticationService,
    /BeginTransactionAsync[\s\S]*RehashNeeded[\s\S]*SessionFactory\.Create[\s\S]*CommitAsync/,
    'rehash, session creation, and evidence do not share a transaction',
  );

  for (const pattern of [
    /EntropyBytes = 32/,
    /RandomNumberGenerator\.GetBytes/,
    /TrimEnd\('='\)/,
    /Replace\('\+', '-'\)/,
    /Replace\('\/', '_'\)/,
  ]) {
    requirePattern(
      errors,
      tokenGenerator,
      pattern,
      `session token generator is missing ${pattern}`,
    );
  }
  requirePattern(
    errors,
    tokenDigest,
    /HMACSHA256\.HashData/,
    'session tokens are not protected by the canonical keyed digest',
  );
  requirePattern(
    errors,
    contracts,
    /RawSessionToken[\s\S]*ToString\(\) => "\[REDACTED\]"/,
    'raw session tokens do not redact string conversion',
  );
  rejectPattern(
    errors,
    entities,
    /RawSessionToken|RawToken/,
    'a raw session token appears in the persistence entity model',
  );

  for (const outcome of [
    'Expired',
    'Revoked',
    'DisabledUser',
    'SecurityVersionMismatch',
    'Unavailable',
  ]) {
    requirePattern(
      errors,
      sessionService,
      new RegExp(`SessionValidationOutcome\\.${outcome}`),
      `session validation does not fail closed for ${outcome}`,
    );
  }
  requirePattern(
    errors,
    sessionRepository,
    /FindByTokenHashAsync[\s\S]*TokenHash == tokenHash\.Value/,
    'session lookup is not owned by the deterministic token hash',
  );
  for (const index of [
    /HasIndex\(session => session\.TokenHash\)\.IsUnique\(\)/,
    /HasIndex\(session => new \{ session\.UserId, session\.RevokedAtUtc, session\.ExpiresAtUtc \}\)/,
  ]) {
    requirePattern(
      errors,
      database,
      index,
      `session persistence is missing index ${index}`,
    );
  }

  for (const marker of [
    'MapPost("/login"',
    'MapGet("/me"',
    'MapPost("/logout"',
    'SetNoStore(context)',
    'Status429TooManyRequests',
    'IsOriginAllowed',
    'IsCsrfAllowed',
  ]) {
    requirePattern(
      errors,
      endpoints,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `authentication endpoint contract is missing ${marker}`,
    );
  }
  for (const marker of [
    'HttpOnly = true',
    'Secure = environment.IsProduction()',
    'SameSite = SameSiteMode.Lax',
    'Path = "/"',
    'MaxAge = sessions.Value.Lifetime',
  ]) {
    requirePattern(
      errors,
      cookiePolicy,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `cookie policy is missing ${marker}`,
    );
  }
  requirePattern(
    errors,
    requestPolicy,
    /HeaderName = "X-Proprium-CSRF"[\s\S]*RequiredValue = "1"/,
    'canonical CSRF header contract is missing',
  );
  requirePattern(
    errors,
    handler,
    /sessions\.ValidateAsync[\s\S]*AuthenticateResult\.Success/,
    'ASP.NET authentication does not delegate to authoritative session validation',
  );
  rejectPattern(
    errors,
    `${authenticationService}\n${sessionService}\n${handler}`,
    /Redis/i,
    'Redis appears in the authoritative credential or session path',
  );

  for (const marker of [
    'AddSecurityDefinition',
    'OperationFilter<CookieAuthenticationOperationFilter>',
  ]) {
    requirePattern(
      errors,
      program,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `OpenAPI registration is missing ${marker}`,
    );
  }
  requirePattern(
    errors,
    operationFilter,
    /OfType<IAuthorizeData>[\s\S]*OpenApiSecurityRequirement/,
    'protected OpenAPI operations do not declare cookie authentication',
  );
  requirePattern(
    errors,
    openApiValidator,
    /PropriumSession[\s\S]*current-user endpoint does not require PropriumSession/,
    'OpenAPI validation does not enforce the authentication scheme',
  );

  for (const evidence of [
    'Login_current_user_and_logout_use_authoritative_server_side_sessions',
    'Authentication_evidence_never_persists_raw_credentials_or_session_tokens',
    'Login_upgrades_an_outdated_password_hash_before_issuing_a_session',
    'Rehash_concurrency_failure_rolls_back_session_and_authentication_events',
    'Role_permission_change_rejects_an_existing_session',
    'Login_correctness_does_not_depend_on_redis',
    'Authentication_openapi_contract_declares_cookie_security_only_for_protected_operations',
  ]) {
    requirePattern(
      errors,
      integrationTests,
      new RegExp(evidence),
      `integration evidence is missing ${evidence}`,
    );
  }
  for (const section of [
    'Password verification',
    'Session token contract',
    'Session validation',
    'HTTP and cookie contract',
    'Authentication events',
    'Validation',
  ]) {
    requirePattern(
      errors,
      documentation,
      new RegExp(`## ${section}`, 'i'),
      `GP-26 documentation is missing ${section}`,
    );
  }

  return errors;
}

module.exports = { validateBackendAuthenticationCore };
