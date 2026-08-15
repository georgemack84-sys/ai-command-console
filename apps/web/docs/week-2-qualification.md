# Week 2 UI foundation qualification

GP-24 qualifies the shared UI foundation established by GP-19 through GP-23. It
does not add a second component, theme, overlay, shell, or route-state system.

## Qualification result

`QUALIFIED` as of 2026-08-15. All repository-owned automated gates pass, and
George Mack completed the Windows Narrator, native 200% browser-zoom, and visual
contrast attestation. The resolved `W2-A11Y-002` exception has been removed.

## Responsive matrix

| Surface           | 320 px                                                                    | Tablet                                                   | 1024 px boundary                                                                        | Desktop/wide                                                                    | 200%                                             |
| ----------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| Application shell | No horizontal overflow; drawer and long navigation remain reachable       | Mobile navigation remains authoritative below 1024 px    | An open drawer closes and releases global state when desktop navigation takes ownership | Sidebar expansion/collapse and flexible main region are covered through 1920 px | Native browser zoom requires human attestation   |
| Core components   | Actions, forms, cards, loading, and terminal states wrap without clipping | Storybook responsive specimens cover intermediate widths | No component owns the shell breakpoint                                                  | Tokenized maximum widths prevent uncontrolled stretching                        | Playwright simulates 200% root text scaling      |
| Overlays          | Long dialogs are bounded and scroll internally                            | Dialog and menu interaction remains viewport-owned       | Portals remain independent of the shell layout transition                               | Layering is verified above the shell header                                     | Native browser zoom requires human attestation   |
| Route states      | Long recovery and not-found copy remains reachable                        | Shared protected boundaries retain the shell             | Boundary ownership does not change                                                      | Standalone and protected presentations remain bounded                           | Text-scale behavior is inherited from primitives |

## Keyboard matrix

| Flow           | Automated evidence                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Shell          | Skip link reaches main; active navigation is exposed; drawer traps focus, closes with Escape, and restores its trigger    |
| Form           | Tab and Shift+Tab reach labeled controls; required and invalid relationships remain programmatic; typed input is retained |
| Dialog         | Initial focus, wrap, Escape, outside dismissal, and trigger restoration                                                   |
| Alert Dialog   | Safe initial focus; outside interaction cannot dismiss a destructive confirmation; cancel restores control                |
| Dropdown Menu  | Enter, arrows, Home, disabled-item skipping, activation, Escape, and focus return                                         |
| Route recovery | Recovery controls receive visible keyboard focus without exposing raw error detail                                        |

## Dependency inventory

- React and Next.js remain the rendering framework.
- Repository-owned CSS variables and component CSS remain the single styling system.
- Radix Dialog, Alert Dialog, and Dropdown Menu remain the single approved overlay behavior layer.
- Storybook 10 with Playwright and Axe remains the component qualification harness.
- No parallel theme provider, CSS-in-JS library, or component suite is admitted.

## CI evidence

The `frontend-validation` job restores the frontend lockfile, runs the canonical
frontend gate (which now includes `validate:week-2`), builds Next.js and static
Storybook, runs Storybook interactions/Axe, tests the application shell, and
verifies invalid configuration fails closed. Local execution is qualification
evidence; GitHub Actions on the published GP-24 revision remains the authoritative
merge record and cannot be claimed before publication.

## Manual attestation

George Mack completed the review on 2026-08-15 using Windows Narrator and Google
Chrome. The login, mobile navigation, long-dialog, recoverable-error, and
API-unavailable boundary surfaces were reviewed across light and dark themes;
the login flow was traversed at Chrome-native 200% zoom. The machine-readable
`accessibility-attestation.json` records the environment, tested surfaces, and
passing outcomes. Any future regression needs a new owned, expiring exception.

## Popover

Not applicable. GP-22 deliberately deferred Popover until a concrete reusable
consumer exists. GP-24 found no consumer and does not add speculative API surface.

## Infrastructure independence

Source validation, unit tests, static Storybook build, Storybook browser tests,
application browser tests, and production frontend build require no PostgreSQL,
Redis, or Docker services. Dependency restoration requires the package registry.

## Week 3 readiness

The UI architecture is mechanically coherent and ready for feature work. Week 3
must consume the existing tokens, primitives, shell, overlays, and route states;
it must not treat automated qualification as proof of the outstanding human
accessibility review.
