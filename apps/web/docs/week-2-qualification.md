# Week 2 UI foundation qualification

GP-24 qualifies the shared UI foundation established by GP-19 through GP-23. It
does not add a second component, theme, overlay, shell, or route-state system.

## Qualification result

`BLOCKED` as of 2026-08-14. All repository-owned automated gates
must pass at the GP-24 revision. The only exit-gate hold is the expired human
screen-reader, native 200% browser-zoom, and visual contrast attestation recorded
as `W2-A11Y-002`. Automated results must not be represented as that human review.

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

No named reviewer has recorded a screen reader, browser-native 200% zoom, or
visual contrast walkthrough for the GP-24 revision. `W2-A11Y-002` expired on
2026-08-05 and has not been silently renewed. The machine-readable
`accessibility-attestation.json` therefore remains `pending_human_review`. A
reviewer must record date, platform, browser, assistive technology, tested
stories/routes, and outcome there and in `accessibility-evidence.md`; any failure
needs a new owned, expiring exception.

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
it must not treat conditional qualification as proof of the outstanding human
accessibility review.
