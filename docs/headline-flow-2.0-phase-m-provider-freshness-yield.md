# Headline Flow 2.0 Phase M - Provider Freshness and Source Yield

## Summary

Phase M hardens live discovery so Headline Flow is less likely to leave subjects empty. RSS now fills under-supplied publisher feeds with Google News RSS search, and web search now targets every missing subject instead of accepting partial broad coverage.

## Changes

- Added a provider-level freshness window diagnostic fixed to 48 hours.
- Added per-topic article counts and low-yield topic diagnostics.
- Updated RSS discovery to use publisher feeds first, then fill remaining capacity with Google News RSS search.
- Updated web search discovery to run targeted fill for all missing subjects whenever the feed is in all-subject mode.
- Updated auto mode so empty or failed RSS attempts can promote to web search before stale cache or fixture fallback.
- Added UI diagnostics for the 48-hour freshness window and thin subjects.
- Updated provider tests for the stronger subject-coverage behavior.

## Verification

- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow/openai-web-search-news-provider.test.ts tests/unit/headline-flow/google-news-rss-provider.test.ts tests/unit/headline-flow/feed-route.test.ts`
- `npx eslint src/server/headline-flow/providers/types.ts src/server/headline-flow/providers/google-news-rss-provider.ts src/server/headline-flow/providers/openai-web-search-news-provider.ts src/components/headline-flow/headline-flow-client.tsx tests/unit/headline-flow/openai-web-search-news-provider.test.ts tests/unit/headline-flow/google-news-rss-provider.test.ts`
