# GP-19 UI Foundation Qualification

## Revision and foundation impact

- Base: GP-18 commit `9601dc877fc25012bf3062c0284c22b059f890ba`
- Branch: `codex/week2-gp19-ui-foundation`
- Classification: `FOUNDATION_COMPATIBLE`
- Week 1 check names changed: NO
- Runtime or backend contract changed: NO

## Architecture

| Responsibility | Actual path |
| --- | --- |
| Token primitives and semantic themes | `apps/web/src/styles/tokens` |
| Global reset/accessibility baseline | `apps/web/src/styles/reset.css`, `apps/web/src/styles/globals.css` |
| Theme contracts and resolution | `apps/web/src/theme` |
| Theme composition | `apps/web/src/providers/theme-provider.tsx` |
| Reusable UI | `apps/web/src/ui` |
| Application composition | `apps/web/src/shell`, `apps/web/src/providers` |
| Storybook configuration | `apps/web/.storybook` |
| Foundation stories | `apps/web/src/ui/foundations` |
| Mechanical policy | `apps/web/scripts/ui-foundation-policy.mjs` |

## Token and theme result

Primitive colors, semantic colors, typography, spacing, radii, elevation, sizing,
motion, layers, focus, selection, and breakpoints have one documented owner. The
remaining raw semantic and global values were moved into the primitive palette;
semantic themes now map only to primitives, and consumers contain neither raw
color literals nor primitive color references.

Light, dark, and system preferences use the existing local storage, system-media,
pre-hydration, provider, and `html[data-theme]` contracts. No account persistence
or environment variable was added.

## Storybook result

| Field | Value |
| --- | --- |
| Version | 10.5.3 (lockfile) |
| Framework | `@storybook/nextjs-vite` |
| Stories | `../src/**/*.stories.@(ts|tsx)` |
| Accessibility | `@storybook/addon-a11y` plus blocking Playwright/Axe coverage |
| Global composition | production styles and `StorybookProviders` |
| Next.js routing | App Router emulation enabled globally |
| Theme modes | light, dark, system |
| Viewports | canonical breakpoints with a 320 px minimum |
| Static command | `npm run repo -- build storybook` |

## Validation contract

The qualifying command set is:

```text
npm run repo -- validate ui-foundation
npm run repo -- validate frontend
npm run repo -- build frontend
npm run repo -- build storybook
npm run test:storybook          (from apps/web)
npm run repo -- validate repo
npm run test:ci-workflow
npm run test:repository-commands
```

Static validation covers format, strict TypeScript, zero-warning ESLint,
dependency boundaries, token/theme invariants, unit coverage, production build,
Storybook build, CI composition, and cross-platform command dispatch. Browser
Storybook checks cover representative interaction and serious/critical Axe
findings.

## Controlled failures

| Guard | Temporary isolated violation | Expected | Result | Restored |
| --- | --- | --- | --- | --- |
| Semantic inventory | remove `--surface-app` | FAIL | PASS | YES |
| Palette ownership | add raw `#fff` to consumer CSS | FAIL | PASS | YES |
| Storybook accessibility | remove `@storybook/addon-a11y` | FAIL | PASS | YES |

The fixtures operate on in-memory copies and do not mutate repository files.

## Observed results

| Command or inspection | Result | Evidence |
| --- | --- | --- |
| `npm run repo -- validate frontend` | PASS | format/static analysis, 85-module dependency graph, 19 theme tests, 63 covered tests |
| `npm run repo -- build frontend` | PASS | Next.js 16.2 production build and seven generated routes |
| `npm run repo -- build storybook` | PASS | Storybook 10.5.3 static build, 353 modules transformed |
| `npm run test:storybook` | PASS | three interaction/accessibility tests |
| Live Storybook manager and preview | PASS | token story rendered; light/dark/system controls present |
| Live theme inspection | PASS | semantic body surface/text values changed for light and dark |
| Live 320 px isolated story | PASS | token story rendered without horizontal overflow |
| Existing authentication story | PASS | App Router mode corrected; story rendered with no browser console error |
| `npm run repo -- validate baseline` | PASS | GP-17 evidence, seven stable CI gates, and GP-18 contract preserved |
| `npm run repo -- validate repo` | PASS | repository, documentation, baseline, and fixture contracts |
| `npm run test:repository-commands` | PASS | 17 dispatcher and PowerShell tests |
| `npm run test:ci-workflow` | PASS | existing seven-job workflow with root-owned Storybook build |

## Accessibility and responsive baseline

| Area | Result | Evidence |
| --- | --- | --- |
| Focus visibility | PASS | global `:focus-visible` plus focus specimen |
| Reduced motion | PASS | reset media query plus existing browser/manual contract |
| Representative contrast | PASS | semantic theme specimens and Storybook/Axe checks |
| Narrow viewport | PASS | 320 px Storybook floor and browser coverage |
| Color-only meaning | PASS | semantic feedback components retain text/roles |

## Existing scope and limitations

- Later-layer shell, authentication, overlay, and feedback code pre-existed GP-19;
  this qualification does not claim those as GP-19 implementation.
- Manual assistive-technology and visual review remains governed by
  `apps/web/docs/accessibility-evidence.md` and its exception register.
- Browser support remains the Chromium CI matrix currently established by the
  repository; this change does not claim a broader matrix.
- The restricted filesystem sandbox could not traverse Storybook's generated
  manager cache. The identical build passed with normal host access and the
  browser-backed suite passed; this is not a source or CI limitation.

Deviations: Existing later-layer code was preserved rather than deleted; replacing
working admitted-baseline functionality would have violated GP-19's inspection and
scope-preservation rules.

`GP-19 STATUS: COMPLETE — UI FOUNDATION READY`
