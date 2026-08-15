function tokenNames(source) {
  return new Set(
    [...source.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)].map(
      (match) => match[1],
    ),
  );
}

export function validateResponsiveShell({
  application,
  drawer,
  navigation,
  styles,
  stories,
  breakpoints,
  shellSources,
  tokens,
}) {
  const errors = [];
  const requireSource = (owner, source, expected, message) => {
    if (!source.includes(expected)) errors.push(`${owner}: ${message}`);
  };

  if (
    /(?:from\s+|import\s+)['"]@\/(?:app|components|lib|providers)(?:\/|['"])/.test(
      shellSources,
    )
  ) {
    errors.push('shell: depends on a prohibited application or feature layer');
  }

  for (const [expected, message] of [
    ['href="#main-workspace"', 'missing skip navigation target'],
    ['<main', 'missing main landmark'],
    ['<ApplicationHeader', 'missing header composition'],
    ['<DesktopSidebar', 'missing desktop navigation composition'],
    ['<MobileNavigationDrawer', 'missing mobile drawer composition'],
    ['breakpoints.large', 'does not consume the canonical large breakpoint'],
  ]) {
    requireSource('application-shell.tsx', application, expected, message);
  }

  for (const expected of [
    '<Dialog',
    '<DialogContent',
    '<DialogTitle',
    'onCloseAutoFocus',
    'triggerRef.current?.focus()',
  ]) {
    requireSource(
      'mobile-navigation-drawer.tsx',
      drawer,
      expected,
      `missing ${expected}`,
    );
  }
  requireSource(
    'shell-navigation.tsx',
    navigation,
    "aria-current={current ? 'page' : undefined}",
    'current destinations must expose aria-current',
  );

  if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(styles))
    errors.push('shell.css: contains a raw color outside token ownership');
  if (/var\(--color-/.test(styles))
    errors.push('shell.css: consumes a primitive color token directly');
  for (const expected of [
    '@media (min-width: 64rem)',
    '@media (prefers-reduced-motion: reduce)',
    '@media (forced-colors: active)',
    'overflow-y: auto',
  ]) {
    requireSource('shell.css', styles, expected, `missing ${expected}`);
  }
  const knownTokens = tokenNames(tokens);
  for (const match of styles.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
    if (!knownTokens.has(match[1]))
      errors.push(`shell.css: unresolved --${match[1]}`);
  }

  requireSource(
    'breakpoints.ts',
    breakpoints,
    'large: 1024',
    'large breakpoint must remain 1024px',
  );
  for (const story of [
    'Expanded',
    'Collapsed',
    'Mobile',
    'MobileDrawerOpen',
    'LongNavigation',
  ]) {
    requireSource(
      'application-shell.stories.tsx',
      stories,
      `export const ${story}`,
      `missing ${story} story`,
    );
  }
  return errors;
}
