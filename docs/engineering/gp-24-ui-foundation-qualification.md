# GP-24: UI foundation qualification

## Decision

GP-24 is a qualification layer over GP-19 through GP-23, not a new UI subsystem.
It aggregates the inherited mechanical gates, adds browser evidence for cross-layer
failure modes, and records a truthful exit result.

## Added controls

- `npm run repo -- validate week-2` is the canonical focused command.
- `validate:frontend` includes the aggregate qualification policy and controlled
  failure fixtures.
- Storybook browser qualification covers 320 px reachability, the exact 1024 px
  ownership transition, 200% root text scaling, visible focus, semantic forms,
  portal cleanup, theme parity, Axe, and browser console errors.
- The qualification record inventories dependencies, responsive and keyboard
  matrices, CI ownership, infrastructure independence, Popover disposition, and
  the remaining manual attestation.

## Architecture findings

One token/theme system, one repository-owned primitive layer, one application
shell, one portal strategy, and one route-state layer remain authoritative. No
duplicate UI dependency is admitted. Popover remains deferred because there is no
concrete consumer.

## Exit rule

Automated gates may establish code readiness but cannot impersonate a human
assistive-technology or visual review. Because `W2-A11Y-002` expired before this
qualification, the correct exit result is `BLOCKED` until a named reviewer
completes and records that work.
