# Headline Flow Production Maturity

## Status

Headline Flow 1.1 is hardened for production preparation. The application can serve live news packages, report feed quality through readiness checks, protect production deployments from accidental fixture data, and keep a recent successful feed available during transient provider failures.

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
- `npm run lint`
- `npm run build`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts tests/unit/env.test.ts`
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line --workers=2`

## Remaining 2.0 Work

This hardening pass does not add durable event memory. Production maturity for Headline Flow 1.x is separate from the 2.0 Event Registry. The next architectural step is persistent event identity, event versions, and user-specific "what changed" state.
