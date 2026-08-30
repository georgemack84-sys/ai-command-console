# Headline Flow Core 1.0 Acceptance

Date: 2026-08-27

## Status

Headline Flow Core 1.0 is accepted for local demo use.

## Accepted Scope

- Authenticated `/headline-flow` product surface.
- Authenticated `/api/headline-flow/feed` endpoint.
- Fixture provider for deterministic fallback and tests.
- RSS provider with direct publisher feeds for all Core subjects.
- Google News RSS fallback when a direct publisher feed cannot supply articles.
- 48-hour current-event window.
- Provider diagnostics for fallback, source coverage, URL rejection, parsing, and link resolution.
- Article-first source links that prefer direct publisher article URLs.

## Verified Subjects

- World
- Politics
- Business
- Technology
- Science
- Health
- Sports
- Entertainment
- General through all-subject mode

## Acceptance Evidence

- `npm run build` passed with Next.js production route generation and standalone packaging.
- `npm run typecheck` passed.
- `npx eslint src/server/headline-flow src/components/headline-flow tests/unit/headline-flow` passed.
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow/google-news-rss-provider.test.ts tests/unit/headline-flow/article-url-filter.test.ts tests/unit/headline-flow/feed-route.test.ts tests/unit/headline-flow/core-pipeline.test.ts` passed.
- Browser QA confirmed `/headline-flow` renders after local demo sign-in, loads live RSS feed data, displays provider diagnostics, and exposes direct article links with no browser console warnings.
- API smoke confirmed each Core subject returns articles without fixture fallback and without Google News wrapper URLs.

## Known Post-1.0 Work

- Replace curated feed constants with configurable source registry entries.
- Add caching so the UI does not wait on live feed fetches on every refresh.
- Expand source diversity and ranking quality by subject.
- Add visual regression coverage for the Headline Flow page.
