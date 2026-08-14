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
