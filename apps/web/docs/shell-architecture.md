# Responsive shell architecture

`ApplicationShell` is the client interaction boundary inside the protected server
layout. The layout supplies route content and optional header slots; the shell
owns only global structure and local responsive interaction state.

## Composition

- `ApplicationHeader` owns the sticky header, route-title slot, generic actions
  slot, account slot, and mobile trigger.
- `DesktopSidebar` owns expanded/collapsed desktop presentation.
- `MobileNavigationDrawer` is a shell-specific modal surface with focus
  containment, Escape/outside dismissal, focus restoration, and scroll locking.
- `ShellNavigation` is the only navigation renderer. Both desktop and mobile
  surfaces receive the same `ShellNavigationItem[]` model.
- `main#main-workspace` is the single route-content landmark and skip-link target.

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
