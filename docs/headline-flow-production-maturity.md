# Headline Flow 2.0-A Production Maturity

## Status

Headline Flow 2.0-A is hardened for production preparation. The application can serve live news packages, report feed quality through readiness checks, protect production deployments from accidental fixture data, preserve durable event identity, capture operator interactions, and keep the branded Headline Flow entry separate from the broader AI Command Console shell.

## Production Controls

- `HEADLINE_FLOW_PROVIDER` selects `auto`, `rss`, `web_search`, or `fixture`.
- `HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER` must be explicitly enabled before fixture data can be requested in production.
- `HEADLINE_FLOW_FEED_CACHE_TTL_MS` controls fresh route-cache lifetime.
- `HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS` controls how long an expired successful feed may be served when the live provider fails or returns no usable stories.
- `HEADLINE_FLOW_MIN_READY_STORIES` sets the minimum successful story count for feed readiness.
- `HEADLINE_FLOW_MIN_READY_TOPICS` sets the minimum represented topic count for feed readiness.
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_SOURCE_LIMIT` protect the feed endpoint from repeated refresh storms.

## Runtime Behavior

- Authenticated feed requests are rate limited per workspace and client IP.
- Fresh cached feeds return `cache.status = hit`.
- Live provider builds return `cache.status = miss`.
- Recent expired feeds can return `cache.status = stale` when the provider fails or produces no stories.
- Stale fallback preserves the previous successful feed and annotates diagnostics with `provider_error_stale_cache` or `provider_empty_stale_cache`.
- Feed builds emit structured logs with provider, story count, article count, duplicate count, rejection count, and fallback reason.
- Unauthenticated `/headline-flow` visits redirect through `/auth?next=%2Fheadline-flow` and return to Headline Flow after login or demo entry.
- Local demo entry uses fixture-backed stories intentionally; production fixture use remains blocked unless `HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER=true`.

## 2.0-A Capabilities

- Durable event identity and versioning for repeated coverage of the same story.
- Article evidence trails and event history surfaces.
- Event controls for save, mute, archive, and priority handling.
- Event library filtering and replay-friendly source inspection.
- Preference-aware ranking from saved-event state and recent interactions.
- Live-provider readiness visibility for RSS, web search, topic breadth, and feed freshness.

## Readiness Behavior

`/api/ready` and `/api/health` include `checks.headlineFlow`.

Headline Flow is production-ready only when:

- a successful feed has been built,
- the last successful feed is not stale,
- the story count meets `HEADLINE_FLOW_MIN_READY_STORIES`,
- the topic count meets `HEADLINE_FLOW_MIN_READY_TOPICS`,
- the feed is not fixture-backed in production.

In production, Headline Flow feed-health failures are critical readiness warnings. In development, they remain warnings so local startup is not blocked before the first feed build.

## Verification

Required release gates:

- `npm run typecheck`
- `npm run lint` or scoped eslint for changed Headline Flow files
- `npm run build`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts tests/unit/env.test.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line --workers=2`
- `npx playwright test playwright/public-routes.spec.ts --project=desktop-chromium --grep "headline flow auth gate|auth page shows"`

## Current Release Candidate

The active release candidate line is `headline-flow-2.0-a-rc4`, with post-RC4 commits stabilizing the branded auth entry and demo startup path. The next release checkpoint should be cut as `headline-flow-2.0-a-rc5` after the browser-test configuration and this maturity record are committed.

## Remaining Production Caveat

The GitHub staging workflow currently runs in artifact-only mode. This is acceptable for package validation, but production maturity is not complete until the staging environment has SSH deployment variables, `DEPLOY_SSH_KEY`, deployment validation paths, and artifact-only mode disabled for a real post-deploy smoke.
