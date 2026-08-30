# Headline Flow 2.0 Phase N - Live Provider Readiness Gate

## Summary

Phase N makes live-provider readiness visible and testable. Headline Flow now exposes a dedicated readiness endpoint and shows a live-readiness strip in the app so missing web-search configuration, thin feed quality, and fixture fallback are no longer hidden caveats.

## Changes

- Added `getHeadlineFlowReadiness()` with RSS, web-search, fixture-fallback, and feed-quality checks.
- Added authenticated `GET /api/headline-flow/readiness`.
- Added a Headline Flow readiness strip showing live status, RSS availability, web-search status, and topic readiness.
- Added an operator notice when `OPENAI_API_KEY` is missing and auto mode cannot recover from thin RSS with web search.
- Added unit coverage for readiness status, production not-ready behavior, and route authentication.

## Production Environment

- `HEADLINE_FLOW_PROVIDER=rss` is the default live mode when OpenAI API credits are not available.
- `OPENAI_API_KEY` is optional and only required for search-enhanced recovery.
- `HEADLINE_FLOW_PROVIDER=auto` can be used for the RSS-to-web-search provider ladder after API credits are available.
- `HEADLINE_FLOW_ALLOW_FIXTURE_PROVIDER=false` should be used in production.
- `HEADLINE_FLOW_MIN_READY_STORIES` and `HEADLINE_FLOW_MIN_READY_TOPICS` define the feed-quality gate.
- `HEADLINE_FLOW_STALE_CACHE_MAX_AGE_MS` controls how long stale live content may be served during provider outages.

## Caveat Resolution

Local Headline Flow now defaults to RSS mode so live headlines do not depend on OpenAI API billing. The keyless RSS/Google News provider was verified against live network access with current articles inside the 48-hour freshness window. OpenAI web search is optional and no longer reported as a readiness caveat while RSS mode is selected.

## Verification

- `npm run typecheck`
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow/readiness.test.ts tests/unit/headline-flow/feed-health.test.ts tests/unit/headline-flow/feed-route.test.ts`
- `npx eslint app/api/headline-flow/readiness/route.ts src/server/headline-flow/application/readiness.ts src/components/headline-flow/headline-flow-client.tsx tests/unit/headline-flow/readiness.test.ts`
