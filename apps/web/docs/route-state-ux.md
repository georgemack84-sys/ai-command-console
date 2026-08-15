# Route-state UX

Route transitions, unexpected failures, and absence are distinct outcomes. Shared
patterns live in `src/ui/route-states`; App Router boundary files compose them and
remain deliberately thin.

## Boundary ownership

The root `loading.tsx`, `error.tsx`, and `not-found.tsx` own a standalone `main`
because public and unmatched routes do not necessarily render inside the protected
shell. The `(protected)` route group owns matching nested boundaries without a
`main`; `ApplicationShell` remains mounted and continues to own
`main#main-workspace`, navigation, and the skip-link target.

`global-error.tsx` is retained only for catastrophic failures that replace the root
layout. It supplies its own `html`, `body`, and `main`, uses safe static copy, and
does not depend on the shell, providers, route-state components, or telemetry.

## Decision guide

- Still waiting for route content → `loading.tsx` or `RouteLoadingState`.
- Route loaded successfully but has zero records → `EmptyState`.
- Unexpected route failure prevents completion → `error.tsx` and
  `RouteErrorState`.
- Requested route/resource does not exist → `notFound()` and
  `not-found.tsx`/`RouteNotFoundState`.
- Capability exists but a dependency is temporarily unavailable →
  `UnavailableState` or feature-level handling.
- Expected validation, conflict, authentication, or permission outcome → explicit
  feature handling, not a generic route error.

`notFound()` represents absence, not failure. Do not use it for empty collections,
generic exceptions, or permission denial unless a later security policy explicitly
requires resource-existence concealment.

## Loading contract

Prefer structural skeletons that preserve expected layout over a blank page and
spinner. `RouteLoadingState` composes the GP-20 `Skeleton`, exposes one polite
status, marks decorative placeholders `aria-hidden`, uses stable keys, and never
moves focus. It has no artificial delay, minimum duration, fake data, or fake
progress. GP-19 reduced-motion policy disables skeleton animation.

## Error and recovery contract

Never render raw error messages, stack traces, exception objects, digests, server
response bodies, paths, connection details, or secrets into generic route error
UI. The framework boundary accepts the supported `error` prop but passes only its
`reset` callback to `RouteErrorState`. No client telemetry service exists yet; the
boundary is the documented future integration point.

Retry/reset is user-driven and bounded to the affected route segment. GP-23 does
not define network retry policy, automatic retry, a countdown, or a full browser
reload for nested failures. Shell navigation and a generic internal recovery link
remain available.

Loading never steals focus. Terminal error and not-found states focus their
semantic level-one heading once on mount so the new page context is discoverable;
native button/link controls follow in document order. Consumers may set
`focusOnMount={false}` for a known
background-refresh presentation that should not interrupt current work.

## Development and testing

Storybook documents standard, long-copy, dense loading, narrow, themed, and
reduced-motion states. Unit tests protect semantics, safe copy, reset callbacks,
recovery links, focus, and main-landmark ownership. Browser-backed Storybook tests
cover keyboard operation, 320px overflow, themes, reduced motion, and Axe.

Run:

```sh
npm run repo -- validate route-states
npm run repo -- validate frontend
npm run repo -- build storybook
```

The route-state validator also runs controlled failures for exception exposure,
duplicate protected `main`, loading focus theft, nested hard reload, and missing
stories.
