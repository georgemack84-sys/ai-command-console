function tokenNames(source) {
  return new Set(
    [...source.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)].map(
      (match) => match[1],
    ),
  );
}

export function validateCoreComponents({
  button,
  forms,
  card,
  feedback,
  styles,
  stories,
  tokens,
}) {
  const errors = [];
  const requireSource = (owner, source, expected, message) => {
    if (!source.includes(expected)) errors.push(`${owner}: ${message}`);
  };

  for (const [owner, source] of Object.entries({
    'button.tsx': button,
    'forms.tsx': forms,
    'card.tsx': card,
    'feedback.tsx': feedback,
  })) {
    if (
      /(?:from\s+|import\s+)['"]@\/(?:app|components|lib|providers|shell)(?:\/|['"])/.test(
        source,
      )
    ) {
      errors.push(
        `${owner}: reusable UI depends on a prohibited application layer`,
      );
    }
  }

  requireSource(
    'button.tsx',
    button,
    "type = 'button'",
    'Button must default to non-submitting native behavior',
  );
  requireSource(
    'button.tsx',
    button,
    'label: string',
    'IconButton must require an accessible label',
  );
  for (const expected of [
    'forwardRef',
    'aria-busy',
    'disabled={disabled || loading}',
  ]) {
    requireSource('button.tsx', button, expected, `missing ${expected}`);
  }

  for (const expected of [
    'useId()',
    '<label',
    "'aria-describedby'",
    "'aria-invalid'",
    'required: required || children.props.required',
  ]) {
    requireSource('forms.tsx', forms, expected, `missing ${expected}`);
  }

  for (const expected of [
    'aria-hidden={label ? undefined : true}',
    'role="status"',
    'aria-labelledby={titleId}',
    "title = 'Something went wrong'",
    "title = 'This is currently unavailable'",
  ]) {
    requireSource('feedback.tsx', feedback, expected, `missing ${expected}`);
  }

  for (const expected of [
    'data-variant={variant}',
    "cardPart('ui-card__header')",
    "cardPart('ui-card__content')",
    "cardPart('ui-card__footer')",
  ]) {
    requireSource('card.tsx', card, expected, `missing ${expected}`);
  }

  if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(styles)) {
    errors.push('components.css: contains a raw color outside token ownership');
  }
  if (/var\(--color-/.test(styles)) {
    errors.push('components.css: consumes a primitive color token directly');
  }
  for (const expected of [
    '@media (prefers-reduced-motion: reduce)',
    '.ui-spinner,',
    '.ui-skeleton {',
    'animation: none;',
    '@media (forced-colors: active)',
  ]) {
    requireSource('components.css', styles, expected, `missing ${expected}`);
  }

  const knownTokens = tokenNames(tokens);
  for (const match of styles.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
    if (!knownTokens.has(match[1])) {
      errors.push(`components.css: unresolved --${match[1]}`);
    }
  }

  for (const storyName of ['Actions', 'Forms', 'Cards', 'Loading', 'States']) {
    requireSource(
      'primitives.stories.tsx',
      stories,
      `export const ${storyName}`,
      `missing ${storyName} story`,
    );
  }

  return errors;
}
