# Week 2 validation contract

This document records the checks required for the Week 2 frontend foundation and distinguishes automated evidence from checks that still require browser or manual evidence.

## Required local command

Run the following from `apps/web` before submitting frontend changes:

```sh
npm run validate:frontend
npm run validate:ui-foundation
npm run validate:components
npm run validate:overlays
npm run validate:route-states
npm run test:coverage
npm run storybook:build
npm run test:storybook
npm run test:browser
NEXT_PUBLIC_APP_NAME=Proprium NEXT_PUBLIC_APP_VERSION=local NEXT_PUBLIC_API_BASE_URL=https://api.local.example NEXT_PUBLIC_ENVIRONMENT=development npm run build
```

`validate:frontend` runs formatting, strict TypeScript, ESLint,
dependency-cruiser architecture rules, passing and intentional-failure fixtures,
the UI-foundation, core-component, responsive-shell, overlay, and route-state contracts, theme
tests, and the Vitest suite. `test:storybook` uses Playwright against the built
Storybook to exercise Dialog, AlertDialog, DropdownMenu, nested overlays, route
loading/error/not-found patterns, narrow layouts, themes, reduced motion, focus
behavior, and Axe. `test:browser` exercises
the application shell and rejects serious or critical Axe findings. Coverage is
collected separately so the report is available without making an unreviewed
percentage threshold a release claim.

## CI contract

The `frontend-validation` CI job runs the same validation command, collects Vitest coverage, builds static Storybook, runs Storybook interactions and Axe checks in Chromium, runs shell and Axe browser checks, verifies that an invalid public environment fails safely, and performs a production Next.js build with explicit public environment values.

The Storybook a11y panel remains development feedback rather than a release assertion. The blocking browser suite rejects serious and critical Axe violations for the shell; the dated manual checklist remains required for assistive-technology and visual review.

## Evidence checklist

| Area                      | Automated evidence                                                                      | Manual or browser evidence still required                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Theme                     | Theme and provider unit tests; production build                                         | Check light, dark, and system preference at startup without a flash                                                    |
| Shell                     | Unit checks; Chromium widths 320–1920 px; skip-link, drawer, preference, and Axe checks | Check at 200% zoom and with assistive technology                                                                       |
| Components                | Unit checks; static Storybook build; browser-backed Storybook interactions              | Inspect native form behavior and focus-visible states                                                                  |
| Overlays                  | Unit checks; Storybook dialog/menu play interaction                                     | Check collision, arrow keys, typeahead, and destructive-action failure/retry behavior                                  |
| Feedback and route states | Unit and policy checks; Storybook keyboard/Axe/320px checks; production build           | Check loading, empty, unavailable, recoverable-error, not-found, and global-error states with a screen reader          |
| Accessibility             | Serious/critical Axe violations rejected for the shell                                  | Complete the manual checklist in `accessibility-evidence.md` and record any exception in `accessibility-exceptions.md` |

## Exit-gate rule

Week 2 may be closed only when every automated command above passes and the outstanding manual/browser checks have either been completed with dated evidence or are explicitly accepted in the exception register. A passing CI job alone is not evidence that the manual checks were performed.

## GP-24 qualification

Run `npm run repo -- validate week-2` from the repository root for the aggregate
policy and controlled-failure gate. The complete certification also requires the
canonical frontend validation, production frontend and Storybook builds,
Storybook and application browser suites, repository-command tests, and
repository validation documented in `docs/week-2-qualification.md`.

As of 2026-08-14, the automated foundation is expected to qualify, but Week 2 is
`CONDITIONALLY_QUALIFIED`: `W2-A11Y-002` expired without a named human
screen-reader, native 200% zoom, and visual contrast attestation.
