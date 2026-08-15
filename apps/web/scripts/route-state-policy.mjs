function tokenNames(source) {
  return new Set(
    [...source.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)].map(
      (match) => match[1],
    ),
  );
}

export function validateRouteStateFoundation({
  loading,
  terminalStates,
  styles,
  stories,
  rootLoading,
  rootError,
  rootNotFound,
  protectedLoading,
  protectedError,
  protectedNotFound,
  globalError,
  tokens,
}) {
  const errors = [];
  const requireSource = (owner, source, expected, message) => {
    if (!source.includes(expected)) errors.push(`${owner}: ${message}`);
  };

  for (const expected of ['Skeleton', 'role="status"', 'aria-busy="true"']) {
    requireSource(
      'route-loading-state.tsx',
      loading,
      expected,
      `missing ${expected}`,
    );
  }
  if (/\.(?:focus|autoFocus)\b/.test(loading))
    errors.push('route-loading-state.tsx: loading must not move focus');
  if (/setTimeout\s*\(/.test(`${loading}\n${terminalStates}`))
    errors.push('route states: arbitrary transition timing is prohibited');

  for (const expected of [
    'ErrorState',
    'EmptyState',
    'onRetry',
    'focusOnMount',
    'recoveryHref',
    'headingLevel={1}',
  ]) {
    requireSource(
      'route-terminal-states.tsx',
      terminalStates,
      expected,
      `missing ${expected}`,
    );
  }
  if (
    /(?:error\.(?:message|stack|cause)|JSON\.stringify\s*\(\s*error|<pre[^>]*>[^<]*error)/.test(
      `${terminalStates}\n${rootError}\n${protectedError}\n${globalError}`,
    )
  ) {
    errors.push('error boundaries: raw error details may reach user-facing UI');
  }
  if (/useEffect\s*\([^]*?reset\s*\(/.test(`${rootError}\n${protectedError}`))
    errors.push('error boundaries: reset must remain user-driven');
  if (/window\.location\.reload\s*\(/.test(`${rootError}\n${protectedError}`))
    errors.push('nested error boundaries: full reload is not a route retry');

  for (const [owner, source] of [
    ['protected/loading.tsx', protectedLoading],
    ['protected/error.tsx', protectedError],
    ['protected/not-found.tsx', protectedNotFound],
  ]) {
    if (/<main\b/.test(source))
      errors.push(`${owner}: duplicates the ApplicationShell main landmark`);
  }
  requireSource(
    'protected/loading.tsx',
    protectedLoading,
    'RouteLoadingState',
    'must compose RouteLoadingState',
  );
  requireSource(
    'protected/error.tsx',
    protectedError,
    'RouteErrorState',
    'must compose RouteErrorState',
  );
  requireSource(
    'protected/not-found.tsx',
    protectedNotFound,
    'RouteNotFoundState',
    'must compose RouteNotFoundState',
  );

  for (const [owner, source, expected] of [
    ['app/loading.tsx', rootLoading, 'RouteLoadingState'],
    ['app/error.tsx', rootError, 'RouteErrorState'],
    ['app/not-found.tsx', rootNotFound, 'RouteNotFoundState'],
  ]) {
    requireSource(owner, source, '<main', 'standalone boundary must own main');
    requireSource(owner, source, expected, `must compose ${expected}`);
  }
  for (const expected of ['<html', '<body', '<main', 'reset']) {
    requireSource(
      'global-error.tsx',
      globalError,
      expected,
      `missing fatal fallback ${expected}`,
    );
  }

  if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(styles))
    errors.push('route-states.css: contains a raw color');
  if (/var\(--color-/.test(styles))
    errors.push('route-states.css: consumes primitive color tokens');
  for (const expected of [
    '.route-state-standalone',
    '.route-loading-state__blocks',
    '.route-state .ui-empty-state__actions',
    '@media (max-width: 24rem)',
    'width: 100%',
  ]) {
    requireSource('route-states.css', styles, expected, `missing ${expected}`);
  }
  const knownTokens = tokenNames(tokens);
  for (const match of styles.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
    if (!knownTokens.has(match[1]))
      errors.push(`route-states.css: unresolved --${match[1]}`);
  }

  for (const story of [
    'Loading',
    'LongLoading',
    'RecoverableError',
    'ErrorWithLongCopy',
    'NotFound',
    'NotFoundWithLongCopy',
  ]) {
    requireSource(
      'route-states.stories.tsx',
      stories,
      `export const ${story}:`,
      `missing ${story} story`,
    );
  }
  return errors;
}
