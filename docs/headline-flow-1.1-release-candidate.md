# Headline Flow 1.1 Release Candidate

Date: 2026-08-29

## Status

Headline Flow 1.1 is release-ready from a local production rehearsal standpoint.

1.0 established the authenticated briefing experience, live article ingestion, current-event filtering, subject coverage, article trails, and diagnostics. 1.1 adds the production maturity layer needed before moving into the 2.0 Event Registry architecture.

## Release Scope

- Authenticated `/headline-flow` briefing surface.
- Authenticated `/api/headline-flow/feed` endpoint.
- Live RSS provider in `auto` mode.
- Fixture provider retained for development and deterministic tests.
- Production fixture-provider guard.
- Route-level feed caching.
- Stale-cache rescue when a live provider fails or returns no usable stories.
- Feed-health tracking for readiness.
- Structured feed diagnostics and production logs.
- Full lint gate restored by excluding generated/runtime artifacts.

## Production Rehearsal

The standalone production server was rehearsed on `http://localhost:5052`.

Observed startup gates:

- Startup correctly failed without `AI_COMMAND_CONSOLE_AUTH_SECRET`.
- Startup correctly failed with stale continuity verification.
- A fresh `system/default` continuity snapshot satisfied the continuity gate.
- Startup required the full production posture: `SECURITY_MODE=enforced`, `OBSERVABILITY_MODE=full`, continuity verification enabled, integrity validation enabled, restore simulation enabled, fail-fast enabled, and debug disabled.

Runtime smoke results:

- Normal login succeeded for `operator@pulse.local`.
- `/api/auth/dev-login` returned `404` in production.
- `/headline-flow` rendered with `200`.
- `/api/headline-flow/feed?provider=fixture` returned `403 fixture_provider_disabled`.
- `/api/headline-flow/feed?limit=9&provider=auto` returned `200`.
- Live RSS selected provider: `rss`.
- Live feed result: 8 stories across 8 topics.
- `/api/ready` returned `200` with status `ready`.
- Headline Flow readiness status: `healthy`.
- Scope monitoring readiness status: `healthy`.

The temporary production server was stopped after rehearsal.

## Verification Gates

- `npm run lint` passed cleanly.
- `npm run typecheck` passed.
- `npm run build` passed with standalone packaging.
- `npx vitest run --config vitest.config.mjs tests/unit/headline-flow tests/unit/health-routes.test.ts tests/unit/env.test.ts` passed with 41 tests.
- `npx playwright test playwright/headline-flow.spec.ts --project=desktop-chromium --project=mobile-chromium --reporter=line --workers=2` passed with 4 tests.

## Runtime Residue Classification

`npm run dev:state-report` reported:

- `data/agents/audit-log.jsonl` as modified tracked legacy runtime residue.
- `data/agents/continuity/` as untracked continuity runtime state.

Classification:

- `data/agents/audit-log.jsonl` is preexisting tracked legacy runtime state. It was not reverted or edited as part of this release candidate because it is outside the Headline Flow release scope and may contain local audit history.
- `data/agents/continuity/` is generated continuity evidence. It is now ignored so future startup rehearsals do not pollute Git status with generated snapshots.

## Release Decision

Headline Flow 1.1 can be treated as the release candidate for the 1.x line.

The next product-development step is Headline Flow 2.0 foundation work:

- Event Registry schema.
- Durable event identity.
- Event versioning.
- User last-viewed state.
- First `what changed` comparison engine.
