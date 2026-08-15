# GP-20 Core UI Components

## Polished implementation posture

Repository inspection found a useful but monolithic primitive prototype on the
qualified GP-19 baseline. GP-20 therefore hardens and separates that admitted code
instead of creating a second library. Existing consumers retain the
`@/ui/components/primitives` compatibility export; the canonical import for new
code is `@/ui/components`.

The original roadmap is narrowed in three places:

- Badge is deferred because no admitted surface currently requires it.
- Overlay primitives remain unchanged baseline code and are not claimed by GP-20.
- `UnavailableState` is retained because existing authentication and route-state
  composition already distinguishes capability absence from generic failure.

This is a `FOUNDATION_COMPATIBLE` change under GP-18. It extends the UI layer while
preserving the GP-19 token, theme, Storybook, accessibility, and dependency owners.

## Architecture

```text
src/ui/components/
├── button.tsx       native Button and IconButton contracts
├── forms.tsx        Label, Input, Textarea, and Field relationships
├── card.tsx         non-semantic visual grouping parts
├── feedback.tsx     Alert, loading primitives, and reusable states
├── class-names.ts   one dependency-free class composition helper
├── components.css   semantic-token component styles
├── primitives.tsx   admitted compatibility exports
└── index.ts         canonical public surface
```

Reusable UI may not import routes, feature components, API clients, providers,
shell state, or domain models. The existing dependency-cruiser rule enforces this
direction; the GP-20 policy adds a focused source guard and controlled failure.

## API decisions

- Native props pass through and `className` composes with component-owned classes.
- Interactive and form primitives forward refs using the React version already
  owned by the repository.
- Button variants are `primary`, `secondary`, `outline`, `ghost`, and `danger`;
  sizes remain the admitted `small`, `medium`, and `large` vocabulary.
- Button defaults to `type="button"`. Loading sets busy and disabled semantics while
  preserving the label box.
- IconButton has a required typed `label` prop and a control-sized hit target.
- Field uses `useId`, preserves explicit IDs and described-by values, and coordinates
  label, help, required, invalid, and error relationships without validating data.
- Card parts add layout but no heading level, landmark, link, or click semantics.
- Spinner and Skeleton are decorative by default; LoadingState owns status text.
- State actions are composed nodes. Reusable state code never navigates or refetches.

## Mechanical contract

`npm run repo -- validate components` checks required artifacts, dependency
direction, native button defaults, typed icon naming, ref/busy/field relationships,
semantic token use, unresolved variables, reduced-motion and forced-color rules,
and representative stories. Five in-memory negative fixtures prove failures for an
accidental submit default, optional IconButton label, application-layer import, raw
color, and unresolved token. The TypeScript suite separately makes a missing
IconButton label an expected compile-time failure.

The existing Frontend Validation CI job runs this contract, strict TypeScript,
Vitest behavior, dependency-cruiser, production build, static Storybook build, and
Playwright/Axe stories without changing protected check names.

## Explicit boundary

GP-20 adds no application shell, navigation, drawer, dialog, menu, popover, tooltip,
toast, authentication workflow, route page, domain form, table, or data behavior.
Those layers compose this component surface in later plans.

`GP-20 STATUS: COMPLETE — CORE UI COMPONENT LAYER READY`
