const requirePattern = (errors, source, pattern, message) => {
  if (!pattern.test(source)) errors.push(message);
};
const rejectPattern = (errors, source, pattern, message) => {
  if (pattern.test(source)) errors.push(message);
};

export function validateAuthenticationUi({
  packageJson,
  authState,
  authService,
  authProvider,
  loginForm,
  loginBoundary,
  protectedBoundary,
  returnPath,
  stories,
  browserCertification,
  liveBrowserCertification,
  authSources,
  backendEndpoints,
  requestPolicy,
  sessionCookieContract,
  documentation,
}) {
  const errors = [];

  requirePattern(
    errors,
    packageJson,
    /"validate:authentication-ui"/,
    'missing aggregate authentication UI gate',
  );
  for (const state of ['unknown', 'authenticated', 'unauthenticated'])
    requirePattern(
      errors,
      authState,
      new RegExp(`status: '${state}'`),
      `missing canonical ${state} session state`,
    );
  rejectPattern(
    errors,
    authState,
    /isAuthenticated\s*:\s*boolean/,
    'boolean-only authentication authority is prohibited',
  );
  requirePattern(
    errors,
    authProvider,
    /getCurrentUser/,
    'current-user endpoint is not the session authority',
  );
  requirePattern(
    errors,
    authProvider,
    /status: 'unknown'/,
    'provider does not fail closed from unknown',
  );

  for (const endpoint of [
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
    '/api/v1/auth/me',
  ])
    requirePattern(
      errors,
      authService,
      new RegExp(endpoint),
      `missing actual backend endpoint ${endpoint}`,
    );
  requirePattern(
    errors,
    authService,
    /body: \{ username, password \}/,
    'login request does not use the backend username/password contract',
  );
  requirePattern(
    errors,
    requestPolicy,
    /X-Proprium-CSRF[\s\S]*['"]1['"]/,
    'canonical CSRF header contract is missing',
  );
  for (const marker of [
    '__Host-proprium_session',
    'proprium_session',
    "environment === 'production'",
  ])
    requirePattern(
      errors,
      sessionCookieContract,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `session cookie contract is missing ${marker}`,
    );
  requirePattern(
    errors,
    backendEndpoints,
    /MapPost\("\/login"[\s\S]*MapGet\("\/me"[\s\S]*MapPost\("\/logout"/,
    'frontend contract does not match the inspected backend endpoints',
  );

  for (const pattern of [
    /<form/,
    /autoComplete="username"/,
    /autoComplete="current-password"/,
    /type=\{visible \? 'text' : 'password'\}/,
    /status === 429/,
    /FieldError/,
  ])
    requirePattern(
      errors,
      loginForm,
      pattern,
      `login form contract is missing ${pattern}`,
    );
  rejectPattern(
    errors,
    loginForm,
    /reason\.message|error\.message/,
    'raw authentication errors may reach the login UI',
  );

  requirePattern(
    errors,
    loginBoundary,
    /state\.status === 'authenticated'[\s\S]*router\.replace\(returnPath\)/,
    'authenticated login-route redirect is missing',
  );
  requirePattern(
    errors,
    loginBoundary,
    /state\.status === 'unauthenticated'/,
    'login form is not gated by an authoritative unauthenticated state',
  );
  requirePattern(
    errors,
    protectedBoundary,
    /state\.status === 'authenticated'[\s\S]*return <>{children}<\/>/,
    'protected children are not gated by authentication',
  );
  requirePattern(
    errors,
    returnPath,
    /defaultAuthenticatedPath = '\/dashboard'/,
    'safe authenticated fallback is not a protected route',
  );
  rejectPattern(
    errors,
    returnPath,
    /return candidate as SafeInternalPath/,
    'return path bypasses structural validation',
  );

  for (const story of [
    'LoginDefault',
    'LoginInvalidCredentials',
    'LoginSubmitting',
    'LoginRateLimited',
    'LoginServiceUnavailable',
    'BootstrapLoading',
  ])
    requirePattern(
      errors,
      stories,
      new RegExp(`export const ${story}`),
      `missing authentication story ${story}`,
    );
  for (const marker of [
    'invalid-opaque-session',
    'Too many sign-in attempts',
    'synthetic-valid-password',
    '200%',
  ])
    requirePattern(
      errors,
      browserCertification,
      new RegExp(marker),
      `browser certification is missing ${marker}`,
    );
  for (const marker of [
    'PROPRIUM_LIVE_AUTH_USERNAME',
    'PROPRIUM_LIVE_AUTH_PASSWORD',
    '/api/v1/health/ready',
    "cookie.name === 'proprium_session'",
    'A revoked PostgreSQL session exposed protected content on replay.',
  ])
    requirePattern(
      errors,
      liveBrowserCertification,
      new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `live browser certification is missing ${marker}`,
    );
  rejectPattern(
    errors,
    liveBrowserCertification,
    /context\.route|page\.route|route\.fulfill/,
    'live browser certification may not intercept authentication transport',
  );

  rejectPattern(
    errors,
    authSources,
    /localStorage|sessionStorage/,
    'authentication authority or credentials may not use browser storage',
  );
  rejectPattern(
    errors,
    authSources,
    /console\.(?:log|info|warn|error)\([^)]*(?:password|token|cookie)/i,
    'sensitive authentication data may not be logged',
  );
  for (const section of [
    'Backend contract',
    'Session state model',
    'No-flash invariant',
    'Security boundaries',
    'Validation',
  ])
    requirePattern(
      errors,
      documentation,
      new RegExp(`## ${section}`, 'i'),
      `authentication documentation is missing ${section}`,
    );

  return errors;
}
