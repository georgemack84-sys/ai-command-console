# GP-19 Frontend UI Foundation

## Status and implementation posture

GP-19 is the first Week 2 implementation plan. Repository inspection found that
the core UI platform already existed on the admitted GP-18 baseline: layered CSS
tokens, theme behavior, accessibility defaults, architecture rules, Storybook,
foundation stories, and frontend CI coverage. GP-19 therefore qualifies and
hardens those authorities instead of replacing them or rebuilding later component
and shell work.

The change is `FOUNDATION_COMPATIBLE`. It preserves all seven GP-15 check names
and adds validation inside the existing Frontend Validation job.

## Architecture and ownership

| Layer | Authority | May depend on |
| --- | --- | --- |
| Raw and semantic design values | `apps/web/src/styles/tokens` | no application layer |
| Theme behavior | `apps/web/src/theme` | configuration and browser boundaries |
| Reusable UI | `apps/web/src/ui` | theme and configuration |
| Application composition | `apps/web/src/shell`, `apps/web/src/providers` | reusable UI and lower layers |
| Feature/application UI | `apps/web/src/components`, `apps/web/src/app` | the public lower-layer interfaces |
| Isolated development | co-located `*.stories.tsx`, `.storybook` | production styles/providers and synthetic data |

Dependency-cruiser enforces the downward dependency model, rejects production
imports of stories/testing tools, and protects private theme internals. Public
reusable components are exported intentionally from `@/ui/components`; generic
folders are not a substitute for ownership.

## Token and styling model

`primitives.css` exclusively owns raw palette, spacing, typography, radius, elevation, size,
and layer values. `motion.css` owns duration and easing. `semantic.css` maps
purpose—surfaces, text, borders, actions, feedback, focus, selection, and the
overlay scrim—to raw values. `themes.css` overrides semantic meaning for dark
mode. Consumers use semantic colors and may not embed raw color literals.

Breakpoints remain TypeScript-owned in `src/config/breakpoints.ts`; Storybook and
application code share that vocabulary. Global CSS is limited to reset,
document/accessibility defaults, and the current shared/component styles. New
component-specific systems should remain with their owner rather than expanding
the global layer indefinitely.

## Theme model

- Preferences: `light`, `dark`, and `system`.
- Resolved themes: `light` and `dark` on `html[data-theme]`.
- Storage: local browser preference under the documented Proprium key; no backend
  preference service is introduced.
- System behavior: one `matchMedia` boundary resolves and observes the browser
  preference.
- Initial render: the repository-owned pre-hydration bootstrap applies the theme
  before application hydration and remains synchronized with its public copy.

## Storybook model

Storybook 10.5.3 uses `@storybook/nextjs-vite`, the production style entry point,
`StorybookProviders`, `@storybook/addon-a11y`, light/dark/system toolbar modes, and
App Router emulation for `next/navigation`, and canonical viewport values with a
320 px floor. Stories are co-located, use
deterministic synthetic content, and require no API, database, Redis, credentials,
or authenticated session.

Use the root-owned commands:

```bash
npm run repo -- storybook
npm run repo -- build storybook
npm run repo -- validate ui-foundation
```

The static build remains a required step in the existing Frontend Validation CI
job. Storybook documents and exercises states; it does not replace unit, browser,
interaction, or accessibility tests.

## Mechanical guard

`validate:ui-foundation` checks the required architecture/docs/story artifacts,
required token families, duplicate and unresolved variables, semantic color use,
dark-theme mappings, reduced-motion defaults, production/App-Router Storybook
parity, the accessibility addon, theme controls, and the 320 px viewport floor. Three isolated negative fixtures
prove that a missing semantic token, raw consumer color, and removed accessibility
addon fail closed.

## Scope boundary

GP-19 does not add product navigation, authentication, dashboards, settings,
search, or a new component library. Some later-layer shell and component code was
already present at the admitted baseline; GP-19 neither claims it as new work nor
removes it. Later plans must continue to use the qualified foundation.

`GP-19 STATUS: COMPLETE — UI FOUNDATION READY`
