const requiredPrimitiveTokens = [
  'color-neutral-0',
  'color-brand-500',
  'color-scrim',
  'space-1',
  'space-4',
  'font-sans',
  'font-size-body',
  'line-height-body',
  'radius-md',
  'shadow-raised',
  'control-height-standard',
  'layer-base',
  'layer-dialog',
];

const requiredMotionTokens = [
  'motion-instant',
  'motion-fast',
  'motion-standard',
  'ease-standard',
];

const requiredSemanticTokens = [
  'surface-app',
  'surface-primary',
  'surface-scrim',
  'text-primary',
  'text-secondary',
  'text-disabled',
  'border-default',
  'border-focus',
  'action-primary-background',
  'action-primary-foreground',
  'feedback-success-background',
  'feedback-success-foreground',
  'feedback-warning-background',
  'feedback-warning-foreground',
  'feedback-danger-background',
  'feedback-danger-foreground',
  'focus-ring',
  'selection-background',
];

const requiredDarkOverrides = [
  'surface-app',
  'surface-primary',
  'text-primary',
  'text-secondary',
  'text-disabled',
  'border-default',
  'focus-ring-offset',
  'feedback-success-background',
  'feedback-warning-background',
  'feedback-danger-background',
];

function definitions(source) {
  const names = [];
  for (const match of source.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)) {
    names.push(match[1]);
  }
  return names;
}

function references(source) {
  return [...source.matchAll(/var\(--([a-z0-9-]+)\)/g)].map(
    (match) => match[1],
  );
}

function requireTokens(errors, owner, actual, expected) {
  for (const token of expected) {
    if (!actual.has(token)) errors.push(`${owner}: missing --${token}`);
  }
}

function rejectDuplicates(errors, owner, names) {
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) errors.push(`${owner}: duplicate --${name}`);
    seen.add(name);
  }
}

export function validateUiFoundation({
  primitives,
  semantic,
  themes,
  motion,
  reset,
  consumerStyles,
  storybookMain,
  storybookPreview,
}) {
  const errors = [];
  const primitiveNames = definitions(primitives);
  const semanticNames = definitions(semantic);
  const themeNames = definitions(themes);
  const motionNames = definitions(motion);

  rejectDuplicates(errors, 'primitives.css', primitiveNames);
  rejectDuplicates(errors, 'semantic.css', semanticNames);
  rejectDuplicates(errors, 'themes.css', themeNames);
  rejectDuplicates(errors, 'motion.css', motionNames);

  requireTokens(
    errors,
    'primitives.css',
    new Set(primitiveNames),
    requiredPrimitiveTokens,
  );
  requireTokens(
    errors,
    'motion.css',
    new Set(motionNames),
    requiredMotionTokens,
  );
  requireTokens(
    errors,
    'semantic.css',
    new Set(semanticNames),
    requiredSemanticTokens,
  );
  requireTokens(
    errors,
    'themes.css',
    new Set(themeNames),
    requiredDarkOverrides,
  );

  const known = new Set([
    ...primitiveNames,
    ...semanticNames,
    ...themeNames,
    ...motionNames,
  ]);
  for (const [owner, source] of Object.entries({
    'semantic.css': semantic,
    'themes.css': themes,
    'globals.css': consumerStyles,
  })) {
    for (const token of references(source)) {
      if (!known.has(token)) errors.push(`${owner}: unresolved --${token}`);
    }
  }

  if (/var\(--color-/.test(consumerStyles)) {
    errors.push(
      'globals.css: consumes a primitive color instead of a semantic token',
    );
  }
  if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(consumerStyles)) {
    errors.push('globals.css: contains a raw color outside the token owners');
  }
  for (const [owner, source] of Object.entries({
    'semantic.css': semantic,
    'themes.css': themes,
  })) {
    if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(source)) {
      errors.push(`${owner}: contains a raw color outside primitives.css`);
    }
  }
  if (!themes.includes("html[data-theme='dark']")) {
    errors.push('themes.css: missing the dark theme root selector');
  }
  for (const expected of [
    '@media (prefers-reduced-motion: reduce)',
    'animation-duration: 0.01ms !important',
    'transition-duration: 0.01ms !important',
  ]) {
    if (!reset.includes(expected)) {
      errors.push(`reset.css: missing ${expected}`);
    }
  }

  for (const expected of [
    "stories: ['../src/**/*.stories.@(ts|tsx)']",
    "'@storybook/addon-a11y'",
    "framework: '@storybook/nextjs-vite'",
  ]) {
    if (!storybookMain.includes(expected)) {
      errors.push(`Storybook main: missing ${expected}`);
    }
  }
  for (const expected of [
    "import '../src/styles/index.css'",
    'StorybookProviders',
    "items: ['light', 'dark', 'system']",
    'nextjs: { appDirectory: true }',
    'Math.max(320, breakpoints[name])',
  ]) {
    if (!storybookPreview.includes(expected)) {
      errors.push(`Storybook preview: missing ${expected}`);
    }
  }

  return errors;
}
