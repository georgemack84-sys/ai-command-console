function tokenNames(source) {
  return new Set(
    [...source.matchAll(/--([a-z0-9-]+)\s*:\s*[^;]+;/g)].map(
      (match) => match[1],
    ),
  );
}

export function validateOverlayFoundation({
  overlays,
  styles,
  stories,
  layout,
  drawer,
  packageManifest,
  tokens,
  directPrimitiveConsumers,
}) {
  const errors = [];
  const requireSource = (owner, source, expected, message) => {
    if (!source.includes(expected)) errors.push(`${owner}: ${message}`);
  };

  if (directPrimitiveConsumers.length) {
    errors.push(
      `overlay ownership: direct Radix imports outside overlays.tsx: ${directPrimitiveConsumers.join(', ')}`,
    );
  }
  if (/setTimeout\s*\(/.test(overlays))
    errors.push('overlays.tsx: uses an arbitrary focus or lifecycle timer');
  if (/acquireScrollLock/.test(overlays))
    errors.push(
      'overlays.tsx: duplicates the primitive-owned modal scroll lock',
    );

  for (const dependency of [
    '@radix-ui/react-dialog',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-dropdown-menu',
  ]) {
    requireSource(
      'package.json',
      packageManifest,
      dependency,
      `missing approved ${dependency} dependency`,
    );
  }
  if (packageManifest.includes('@radix-ui/react-popover'))
    errors.push(
      'package.json: Popover was added without an immediate reusable requirement',
    );

  for (const expected of [
    'DialogPrimitive.Portal',
    'DialogPrimitive.Overlay',
    'DialogPrimitive.Content',
    'DialogPrimitive.Title',
    'DialogPrimitive.Description',
    'forwardRef',
    "document.getElementById('proprium-overlay-root')",
  ]) {
    requireSource('overlays.tsx', overlays, expected, `missing ${expected}`);
  }
  for (const expected of [
    'AlertDialogPrimitive.Root',
    'AlertDialogPrimitive.Cancel',
    'AlertDialogPrimitive.Action',
    'AlertDialogPrimitive.Title',
    'AlertDialogPrimitive.Description',
  ]) {
    requireSource('overlays.tsx', overlays, expected, `missing ${expected}`);
  }
  for (const expected of [
    'DropdownMenuPrimitive.Root',
    'DropdownMenuPrimitive.Item',
    'DropdownMenuPrimitive.Separator',
    'collisionPadding',
    "variant?: 'default' | 'danger'",
  ]) {
    requireSource('overlays.tsx', overlays, expected, `missing ${expected}`);
  }

  requireSource(
    'layout.tsx',
    layout,
    'id="proprium-overlay-root"',
    'missing canonical portal root',
  );
  requireSource(
    'mobile-navigation-drawer.tsx',
    drawer,
    '<DialogContent',
    'shell drawer must use the overlay foundation',
  );

  if (/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\()/i.test(styles))
    errors.push('components.css: overlay styles contain a raw color');
  if (/var\(--color-/.test(styles))
    errors.push(
      'components.css: overlay styles consume primitive color tokens',
    );
  for (const expected of [
    'z-index: var(--layer-overlay)',
    'z-index: var(--layer-dialog)',
    'z-index: var(--layer-dropdown)',
    'max-height: calc(100dvh - var(--space-8))',
    '@media (prefers-reduced-motion: reduce)',
    '.ui-dropdown__item[data-highlighted]',
    ".ui-dropdown__item[data-variant='danger']",
    '.ui-dropdown__item[data-disabled]',
  ]) {
    requireSource('components.css', styles, expected, `missing ${expected}`);
  }
  const knownTokens = tokenNames(tokens);
  for (const match of styles.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
    if (!knownTokens.has(match[1]))
      errors.push(`components.css: unresolved --${match[1]}`);
  }

  for (const story of [
    'DialogBasic',
    'DialogLongContent',
    'AlertDialogDestructive',
    'DropdownActions',
    'NestedConfirmation',
    'OverlayInShell',
  ]) {
    requireSource(
      'overlays.stories.tsx',
      stories,
      `export const ${story}`,
      `missing ${story} story`,
    );
  }
  return errors;
}
