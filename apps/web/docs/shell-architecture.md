# Responsive shell architecture

`ApplicationShell` is the client interaction boundary inside the protected server
layout. The layout supplies route content and optional header slots; the shell
owns only global structure and local responsive interaction state.

## Composition

- `ApplicationHeader` owns the sticky header, route-title slot, generic actions
  slot, account slot, and mobile trigger.
- `DesktopSidebar` owns expanded/collapsed desktop presentation.
- `MobileNavigationDrawer` is shell-specific presentation composed on the GP-22
  Dialog behavior layer. Radix owns focus containment, Escape/outside dismissal,
  background isolation, and scroll locking; the drawer supplies its restoration
  target and navigation content.
- `ShellNavigation` is the only navigation renderer. Both desktop and mobile
  surfaces receive the same `ShellNavigationItem[]` model.
- `main#main-workspace` is the single route-content landmark and skip-link target.
- `(protected)/loading.tsx`, `error.tsx`, and `not-found.tsx` render inside that
  landmark and therefore never introduce another `main`; the shell remains mounted
  while protected route content loads, fails, or resolves as missing.

CSS owns the layout switch at the GP-19 `large` breakpoint (1024px). Below it,
the sidebar is hidden and the menu trigger opens a drawer; at and above it, the
sidebar is persistent and may collapse from 17rem to 5rem. Shell dimensions,
spacing, surfaces, layers, motion, and focus styling consume GP-19 tokens. No
viewport-dependent server/client render branch or browser-storage preference is
used, preventing hydration disagreement.

## Extension boundary

Protected routes inherit the shell from `app/(protected)/layout.tsx`; route pages
must not create parallel global headers or sidebars. Header features compose into
slots and remain outside shell ownership. GP-21 navigation is structural. Future
registry and authorization work must replace/filter the navigation data source,
not recreate sidebar or drawer rendering and not turn the shell into a permission
evaluator.

Root public/unmatched boundaries are outside this ownership and may supply their
own standalone `main`. The catastrophic `global-error.tsx` replaces the root
layout and is the only fallback permitted to supply its own HTML/body structure.
