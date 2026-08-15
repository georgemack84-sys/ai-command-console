# Phase 1 Week 2: UI Foundation

Week 2 begins from the [GP-18 admitted baseline](../validation/day-5/week-2-admission.md)
and builds user-interface layers without weakening Week 1 contracts.

## GP-19: Frontend UI foundation

GP-19 qualifies and hardens the existing token, theme, accessibility, architecture,
and Storybook authorities. See the [implementation specification](../engineering/gp-19-ui-foundation.md)
and [qualification record](../validation/week-2/gp-19-ui-foundation.md).

Later Week 2 component and application-shell plans must be specified separately.
They inherit GP-19 and may not introduce parallel token, theme, styling, Storybook,
or dependency systems.

## GP-20: Core UI components

GP-20 qualifies the admitted primitive prototype and establishes production-ready
actions, form controls and relationships, cards, loading feedback, and reusable
empty/error/unavailable states. The scope deliberately excludes shell, overlay, and
domain-specific work. See the [implementation specification](../engineering/gp-20-core-components.md)
and [qualification record](../validation/week-2/gp-20-core-components.md).

## GP-21: Responsive application shell

GP-21 establishes the shared protected-route frame: header slots, one navigation
renderer, collapsible desktop sidebar, flexible main landmark, and accessible
mobile drawer at the canonical 1024px breakpoint. See the
[implementation specification](../engineering/gp-21-responsive-shell.md) and
[qualification record](../validation/week-2/gp-21-responsive-shell.md).

## GP-22: Overlay interaction foundation

GP-22 establishes repository-owned Dialog, AlertDialog, and DropdownMenu wrappers
over the approved Radix behavior layer, including one portal strategy, focus and
Escape ownership, responsive tokenized styling, nested interaction coverage, and
mechanical enforcement. Popover is deferred until a concrete reusable consumer
exists. See the [implementation specification](../engineering/gp-22-overlay-foundation.md)
and [qualification record](../validation/week-2/gp-22-overlay-foundation.md).

## GP-23: Route-state UX

GP-23 establishes reusable loading, recoverable error, and not-found patterns plus
root and protected App Router boundaries. Protected failures preserve the GP-21
shell; generic error UI never exposes exception detail; loading remains polite and
focus-neutral; terminal states provide keyboard recovery and discoverable context.
See the [implementation specification](../engineering/gp-23-route-state-ux.md) and
[qualification record](../validation/week-2/gp-23-route-state-ux.md).

## GP-24: UI foundation qualification

GP-24 aggregates and qualifies the complete Week 2 foundation across responsive
shell, primitives, overlays, route states, Storybook, accessibility, keyboard
walkthroughs, 320px-or-wider behavior, scaling, cleanup, and CI ownership. The
automated foundation is ready, while the expired human assistive-technology and
visual-review exception makes the exit result conditional. See the
[implementation specification](../engineering/gp-24-ui-foundation-qualification.md)
and [qualification record](../validation/week-2/gp-24-ui-foundation-qualification.md).

GP-25 may begin feature delivery on this foundation but may not claim the pending
human accessibility attestation or introduce parallel foundation systems.
