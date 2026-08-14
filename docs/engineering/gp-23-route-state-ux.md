# GP-23 Route-State UX

GP-23 establishes loading, unexpected failure, and absence as distinct route
outcomes. Reusable `RouteLoadingState`, `RouteErrorState`, and
`RouteNotFoundState` patterns compose the GP-20 Skeleton, ErrorState, EmptyState,
Button behavior, and Next.js Link while consuming GP-19 tokens and focus styling.

The App Router hierarchy intentionally has two levels. Root boundaries own a
standalone main landmark for public and unmatched routes. Matching boundaries in
`app/(protected)` render below `ApplicationShell`, preserve the GP-21 header and
navigation, and do not duplicate its `main#main-workspace`. The pre-existing
`global-error.tsx` remains the minimal catastrophic root-layout fallback and does
not depend on providers, shell, shared route patterns, or a new observability SDK.

Loading exposes one polite status, keeps deterministic skeletons decorative, does
not move focus, and adds no artificial delay. Error and not-found outcomes focus
their semantic level-one heading once when mounted, provide keyboard-native recovery,
and retain shell navigation. Reset is user-driven and scoped to the affected
boundary. Generic UI never consumes or renders the incoming error object.

Run `npm run repo -- validate route-states` for artifact, composition, landmark,
safe-error, focus, responsive-style, story, and five controlled-failure checks.
The detailed developer decision guide is in
`apps/web/docs/route-state-ux.md`.

Classification: `FOUNDATION_COMPATIBLE`. GP-23 extends the admitted Week 2
presentation layer without changing the GP-18 baseline, backend contracts, auth,
permissions, telemetry, global state, or dependency inventory.
