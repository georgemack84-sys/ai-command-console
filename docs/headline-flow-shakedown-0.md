# Headline Flow Shakedown 0

Date: 2026-08-27
Repository: `C:\Users\georg\ai-command-console`

## Repository

This checkout is a Next.js 16.3.1 application named `ai-command-console`, not a dedicated Headline Flow repository. It currently contains a large operational console with authenticated app routes, Prisma persistence, RSS source ingestion, background jobs, AI summary services, health/readiness endpoints, and extensive governance/learning/recovery surfaces.

Current top-level components include:

```text
app/                 Next App Router routes and API handlers
src/                 primary frontend/server application code
services/            legacy/runtime service modules and job queue
prisma/              Prisma schema and migrations
tests/               unit, integration, replay, validation, and e2e tests
scripts/             dev, worker, validation, and operational scripts
docs/                architecture, engineering, governance, and operations docs
components/          additional UI components outside src
apps/web/            separate web app package surface
```

Important package/runtime facts:

- Framework: Next.js `16.3.1` with Turbopack.
- React: `19.2.3`.
- Package manager: npm with `package-lock.json`.
- Database ORM: Prisma `6.19.3`.
- News-like ingestion dependency: `rss-parser`.
- AI provider dependency: `openai`.
- Test runner: Vitest, Node test runner, Playwright.
- Local Next agent rule: read `node_modules/next/dist/docs/` before changing Next app/router code.

## Architecture

Current architecture is an AI Command Console, not yet Headline Flow Core 1.0.

Existing news-adjacent architecture:

```text
Authenticated UI / API
        |
        v
Sources API
        |
        v
Source service
        |
        v
Connector registry
        |
        v
RSS connector
        |
        v
RSS ingestion service
        |
        v
Prisma Source / MonitoredUpdate / ActivityEvent
        |
        v
Optional background insight generation
```

There is no current `headline-flow`, `headlines`, `news`, `story package`, or event-engine module in this checkout. A prior prototype may have existed in another working state, but the repository currently visible to Codex does not contain it.

## Runtime Flow

Actual source ingestion flow:

1. A user creates a source via `app/api/sources/route.ts`.
2. `createSource` validates auth, workspace role, URL shape, source uniqueness, and writes `Source`.
3. A refresh request queues a `source:refresh` background job through `requestSourceRefresh`.
4. `background-jobs.ts` resolves the source type and dispatches through `refreshSourceByConnector`.
5. The connector registry maps `feed` to the RSS connector.
6. `refreshRssSource` fetches XML with timeout, user agent, content-length limit, and byte-size limit.
7. `rss-parser` parses the feed.
8. Each item becomes a `NormalizedRssItem`.
9. Existing updates are checked by `metadata.dedupeKey`.
10. New items are stored as `MonitoredUpdate` rows with metadata.
11. Source status becomes `healthy` on success or `degraded` on failure.
12. Activity events, diagnostics, analytics, alerts, and optional insight-generation jobs are emitted.

This is a good substrate for Pi-B ingestion, but it is not yet a Headline Flow event/story model.

## Current Capabilities

Present:

- Authenticated source creation and listing.
- RSS feed ingestion with bounded timeout and payload size.
- Basic duplicate prevention using RSS GUID/link/title-derived `dedupeKey`.
- Source health state: `healthy` or `degraded`.
- Background job abstraction with queue health.
- AI summary service with OpenAI and deterministic mock fallback.
- Runtime diagnostics, analytics events, health and readiness endpoints.
- Prisma persistence for sources, monitored updates, insights, alerts, activity, workspace state, and monitoring state.

Not present as Headline Flow capabilities:

- Canonical Headline Flow Article model.
- Canonical Story/Event model.
- StoryPackage API for Pi-A.
- Event versioning or change records.
- Briefing model.
- Headline Flow-specific provider boundary.
- Article-to-event clustering.
- Source agreement/disagreement model.
- Dedicated Axiom Pi-A client contract.
- Headline Flow fixture provider and acceptance test.

## Test Baseline

Commands run during this shakedown:

```text
npm run typecheck
PASS

npm run build
PASS

npm exec -- vitest run tests/unit/health-routes.test.ts tests/unit/alert-service.test.ts tests/unit/continuity-snapshot.test.ts tests/unit/settings-workspace-route.test.ts tests/unit/settings-invites-route.test.ts --config vitest.config.mjs
PASS: 5 files, 19 tests

npm exec -- eslint app/api/ready/route.ts tests/unit/health-routes.test.ts
PASS
```

Broad lint baseline:

```text
npm run lint
INCONCLUSIVE
```

The whole-workspace lint run produced no findings but was manually interrupted after roughly two minutes. The repository is large enough that scoped linting is currently more practical during shakedown batches.

Test inventory:

- `rg --files tests` found 2758 test files.
- Relevant existing tests include RSS ingestion, source service, health/readiness routes, AI service, job queue, dashboard, database health, and observability health.

## Build Baseline

`npm run build` passed with Next.js 16.3.1/Turbopack.

Build generated 57 app pages and a large dynamic API surface. This proves the current app compiles, route collection succeeds, TypeScript passes inside build, and standalone asset packaging completes.

## Startup Baseline

The dev server was started on port 3000.

Live probes after the readiness fix:

```text
GET /api/health  200
GET /api/ready   200
GET /            200
```

`/api/ready` reports `ready_with_warnings` in local development because scoped-work monitoring is stale, but it no longer blocks local readiness.

## P0

No current P0 remains from the shakedown checks.

One P0-like local startup blocker was found and fixed before this report:

Issue: local readiness returned 503 because stale scoped-work monitoring was treated as critical in development.
Location: `app/api/ready/route.ts`
Severity: P0 for local development loop, P2 for production architecture.
Why it matters: the app appeared not ready even though health, DB, build, and root rendering worked.
Correction made: stale/failing scope monitoring remains visible but only blocks readiness in production.
Regression risk: readiness semantics could hide a real worker problem in local dev; production remains fail-closed.
Test required: added dev warning and production critical regression coverage in `tests/unit/health-routes.test.ts`.

## P1

### P1-1: Headline Flow product surface is absent in this checkout

Issue: the supplied Headline Flow brief describes a product/service that is not currently present as a distinct module or route.
Location: repository-wide. `rg` finds RSS/source ingestion but no Headline Flow app/module/API.
Severity: P1 for the Headline Flow objective.
Why it matters: Core 1.0 cannot be stabilized as Headline Flow until the current substrate is either explicitly adopted or a bounded Headline Flow module is restored/created.
Recommended correction: establish a minimal `headline-flow` domain/application boundary rather than spreading Headline Flow behavior across generic dashboard/source/insight services.
Regression risk: medium. Creating a new boundary can duplicate existing source/summary behavior if not carefully mapped.
Test required: fixture-driven Core 1.0 acceptance test from provider fixture to story package API.

### P1-2: URL safety is incomplete for server-side RSS fetching

Issue: source URL validation rejects localhost only in production and does not clearly block private network ranges, metadata IPs, or redirect-to-private-network SSRF paths.
Location: `src/server/services/source-service.ts`, `src/server/services/rss-ingestion-service.ts`
Severity: P1 security for any deployment that allows user-managed feed URLs.
Why it matters: Headline Flow will fetch externally supplied URLs server-side on Pi-B. Without stronger SSRF controls, a malicious or mistaken feed URL could target internal services.
Recommended correction: add a safe outbound URL policy for ingestion that blocks localhost, private/link-local/metadata ranges, unsupported protocols, dangerous redirects, and oversized responses in all non-test environments unless explicitly enabled for local fixture mode.
Regression risk: medium. Local developers may rely on localhost feeds; provide an explicit fixture/local override.
Test required: source-service and RSS ingestion tests for localhost, private IP, redirect, invalid protocol, and allowed public feed.

### P1-3: Current persistence model stores updates, not articles/events

Issue: RSS entries become `MonitoredUpdate` records, not canonical articles or event-linked evidence.
Location: `prisma/schema.prisma`, `src/server/services/rss-ingestion-service.ts`
Severity: P1 architecture for Headline Flow.
Why it matters: the target product depends on article evidence, story/event grouping, source provenance, and change history. `MonitoredUpdate` is too generic to carry that responsibility safely.
Recommended correction: introduce minimal canonical Headline Flow types first in code, then persist only the fields needed for Core 1.0.
Regression risk: medium. Avoid migrating existing dashboard updates until the new domain model is proven.
Test required: canonical article validation, dedupe, story package generation, and source provenance tests.

## P2

### P2-1: Provider boundary exists but is too generic for Headline Flow

Issue: connector registry supports `feed` plus stubs for website/repository/integration/document, but it returns ingestion results into generic workspace updates.
Location: `src/server/ingestion/connector-registry.ts`
Severity: P2.
Why it matters: adding Headline Flow providers directly here may leak generic console assumptions into the news engine.
Recommended correction: keep this registry as infrastructure inspiration, but create a Headline Flow provider interface that returns canonical article candidates.
Regression risk: low if implemented alongside existing ingestion.
Test required: provider contract tests with fixtures.

### P2-2: Deduplication is only per-source metadata lookup

Issue: duplicate detection checks `metadata.dedupeKey` within a source. It does not canonicalize article URLs or detect cross-source duplicates.
Location: `src/server/services/rss-ingestion-service.ts`
Severity: P2.
Why it matters: Headline Flow's event model requires avoiding repeated coverage and grouping obvious duplicates.
Recommended correction: add URL canonicalization and content fingerprint utilities in the future Headline Flow domain layer.
Regression risk: medium. Over-aggressive canonicalization can merge distinct resources.
Test required: deterministic URL/fingerprint tests and conservative false-merge cases.

### P2-3: Ingestion is sequential per feed item

Issue: each RSS item checks and writes serially.
Location: `src/server/services/rss-ingestion-service.ts`
Severity: P2 for performance at scale, P3 for current small feeds.
Why it matters: Pi-B should use bounded work, not unbounded concurrency, but serial item-level DB calls may become slow.
Recommended correction: retain bounded processing, but consider batched lookup/create once Headline Flow volume is measured.
Regression risk: medium around duplicate behavior and transaction semantics.
Test required: batch duplicate prevention and partial failure behavior.

### P2-4: Fixture mode is not a first-class Headline Flow mode

Issue: tests mock RSS fetches, but there is no product-level fixture provider for offline demos, Codex sessions, or Axiom simulation.
Location: missing.
Severity: P2.
Why it matters: Core 1.0 should be provable without live internet or paid APIs.
Recommended correction: implement a deterministic `FixtureNewsProvider` inside Headline Flow once the provider contract exists.
Regression risk: low.
Test required: fixture acceptance test from articles to story packages.

### P2-5: Whole-repo lint is too slow for tight shakedown loops

Issue: `npm run lint` did not finish within the practical shakedown window.
Location: `package.json` lint script / repository scale.
Severity: P2 for developer workflow.
Why it matters: a slow lint baseline discourages frequent verification.
Recommended correction: add documented scoped lint commands for changed files or product areas; keep full lint for CI/nightly.
Regression risk: low.
Test required: none, but document command behavior.

## P3

### P3-1: Documentation does not describe Headline Flow's current reality

Issue: the briefs describe target architecture, but repo docs do not yet map current source ingestion to Headline Flow decisions.
Location: `docs/`
Severity: P3.
Recommended correction: keep this shakedown report and follow it with lightweight ADRs after architecture choices are approved.

### P3-2: Source status is coarse

Issue: source health is `healthy` or `degraded` without provider-specific failure categories.
Location: `Source.status`, ingestion diagnostics.
Severity: P3 now, P2 for Axiom readiness.
Recommended correction: retain richer ingestion audit fields when Headline Flow ingestion cycles are introduced.

### P3-3: Generic insight generation is coupled to RSS ingestion completion

Issue: RSS ingestion queues `workspace:generate-insights` after new updates.
Location: `src/server/services/rss-ingestion-service.ts`
Severity: P3 for current app, P2 if reused for Headline Flow.
Recommended correction: Headline Flow summarization/ranking should be a separate application use case, not a side effect hidden inside generic RSS refresh.

## Axiom Blockers

- No Headline Flow API contract exists for Pi-A.
- No StoryPackage boundary exists.
- Pi-B/Pi-A split is not represented in code or docs for Headline Flow.
- Durable Headline Flow event memory is absent.
- Fixture/offline mode is not productized.
- Backend loss/degraded Headline Flow UI behavior is not yet testable because there is no Headline Flow client.

## ARM64 Blockers

Known dependencies to review before Raspberry Pi deployment:

- `better-sqlite3`: native module; verify ARM64 install/build on target OS.
- `@prisma/client` / Prisma engines: verify ARM64 engine compatibility and deployment packaging.
- `mapbox-gl` / browser-heavy UI dependencies: likely Pi-A/browser concern, not Pi-B engine concern.
- `next` production build/runtime memory: needs Raspberry Pi measurement.

No ARM64 test was run in this Windows environment.

## Security Findings

Strong points:

- API routes generally authenticate via `getSessionUser`.
- Source creation requires workspace manager role.
- Rate limits exist for source creation/refresh.
- RSS fetch has timeout and payload-size controls.
- AI summary service has provider fallback and budget-aware diagnostics.

Risks:

- SSRF protections for feed URLs are incomplete.
- External RSS content is stored as title/summary/metadata and later displayed; rendering surfaces must continue escaping untrusted content.
- Provider failures are recorded, but future Headline Flow media/article fetching will need stricter URL/media safety than current RSS XML fetch.
- No Headline Flow-specific internal API authentication model exists for Pi-A to Pi-B.

## Performance Findings

Strong points:

- RSS fetch timeout is configurable.
- RSS max item count and max payload bytes are configurable.
- Background worker has configurable polling and queue limits.
- Scope monitoring concurrency is bounded.

Risks:

- RSS ingestion performs per-item duplicate queries and creates.
- No Headline Flow feed cache or precomputed story package exists.
- No measured Pi-B resource baseline exists.
- Next app is broad; Pi-A should not carry unnecessary backend/admin UI if Headline Flow becomes an appliance client.

## Dependency Assessment

Current dependencies are broad because the repository is a full AI command console. For Headline Flow Core 1.0, the relevant dependency set should be much smaller:

- Required substrate: Next route handlers or separate service host, Prisma/Postgres, RSS/client fetch, tests.
- Optional: OpenAI summarizer adapter.
- Avoid adding: Redis, brokers, vector DB, graph DB, multi-agent frameworks, video generation, or Praxis dependency until measured need exists.

## Recommended Changes

1. Preserve the current green baseline.
2. Formalize whether Headline Flow will be a module inside this repository or a separate service package.
3. Add a minimal Headline Flow domain skeleton:
   - `Source`
   - `CanonicalArticle`
   - `CanonicalStory`
   - `StoryPackage`
   - provider and summarizer interfaces
4. Add fixture provider and Core 1.0 acceptance test before live providers.
5. Add URL safety policy for server-side ingestion.
6. Add deterministic URL canonicalization and fingerprint utilities.
7. Add a `GET /api/headline-flow/feed` style internal API only after the domain pipeline has tests.
8. Add persistence after in-memory fixture pipeline behavior is proven.
9. Add Axiom client/degraded state after API contract stabilizes.

## Recommended Order

Immediate stabilization order:

```text
1. Confirm Headline Flow module location.
2. Add SSRF-safe ingestion URL policy.
3. Add Headline Flow canonical domain types.
4. Add fixture provider.
5. Add deterministic Core 1.0 acceptance test.
6. Add provider adapter contract.
7. Add dedupe/fingerprint logic.
8. Add story package builder.
9. Add internal feed API.
10. Add persistence/repositories.
11. Add Axiom Pi-A client boundary.
```

## Files Likely Affected

Near-term:

```text
src/server/services/source-service.ts
src/server/services/rss-ingestion-service.ts
tests/unit/source-service.test.ts
tests/unit/rss-ingestion-service.test.ts
```

For new Headline Flow Core:

```text
src/server/headline-flow/domain/*
src/server/headline-flow/providers/*
src/server/headline-flow/application/*
src/server/headline-flow/infrastructure/*
app/api/headline-flow/*
tests/unit/headline-flow/*
tests/integration/headline-flow/*
docs/architecture/*
```

The exact paths should follow the repository's existing conventions once the module location is approved.

## Tests Needed

Minimum next tests:

- URL safety policy tests.
- Fixture provider contract test.
- Canonical article validation test.
- URL canonicalization and fingerprint tests.
- Deduplication test.
- Conservative clustering test.
- Ranking relationship test.
- Story package contract test.
- API feed contract test.
- Provider failure/degraded response test.

## Shakedown Conclusion

The current repository is buildable, type-safe at baseline, and runnable. It has useful ingredients for Headline Flow, especially RSS ingestion, background jobs, Prisma persistence, diagnostics, readiness, and AI fallback behavior.

However, Headline Flow as described in the briefs is not currently implemented in this checkout. The next safest move is not Situation Room, Praxis, Noesis integration, or advanced event intelligence. The next safest move is to establish a small, tested Headline Flow Core boundary that converts deterministic provider fixtures into canonical articles, conservative stories, and lightweight story packages.

Architectural mantra for the next batch:

```text
Ingest once.
Normalize once.
Understand stories centrally.
Present them anywhere.
```

