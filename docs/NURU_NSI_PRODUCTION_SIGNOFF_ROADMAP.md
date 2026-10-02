# Nuru Source Intelligence Production Sign-off Roadmap

This roadmap defines the work required before NSI can be called production-safe. Passing a feature test is not production sign-off. Every gate below must have retained evidence.

## Sign-off principles

- NSI remains fail-closed: missing provenance, policy, claim linkage, or evidence blocks canonical admission.
- A production release may not weaken source approval, raw-artifact preservation, or the claim-bound admission gate.
- Each gate has an accountable owner, recorded evidence, and an explicit go/no-go decision.

## Gate 0 — Release baseline

**Owner:** Engineering lead

- Freeze NSI schema changes for the release candidate.
- Run `prisma migrate status`, `prisma validate`, targeted lint, type checks, and the full NSI regression suite in CI.
- Rehearse migrations against a production-sized restored database.
- Produce a versioned release manifest: application commit, Prisma migration list, environment version, and rollback decision.

**Exit:** CI is green, migrations are forward-compatible, and rollback/roll-forward instructions are approved.

## Gate 1 — Network and connector safety

**Owner:** Security engineering

- Move all external retrieval into a dedicated egress worker with a deny-by-default network policy.
- Resolve DNS immediately before connection; reject loopback, private, link-local, multicast, and reserved resolved addresses.
- Re-check every redirect target after DNS resolution. Limit redirects, response bytes, timeouts, content types, and decompression expansion.
- Store no URL credentials, fragments, authorization headers, or response secrets in artifacts, logs, analytics, or audits.
- Run SSRF/DNS-rebinding and redirect-chain penetration tests.

**Exit:** Security review signs off on an automated abuse test suite; failed checks create actionable alerts.

## Gate 2 — Identity, authorization, and abuse controls

**Owner:** Application security

- Add authenticated integration tests for viewer, manager, and cross-workspace access to every NSI route.
- Use a distributed rate-limit store in production; in-memory limits are development-only.
- Apply per-user, per-workspace, and per-IP budgets to all state-changing NSI actions, with distinct conservative budgets for canonical admission and fetch dispatch.
- Enforce request body limits at the edge and application layer; reject unexpected JSON fields for all NSI write contracts.
- Verify CSRF protection for cookie-authenticated browser writes, or require an equivalent same-origin/token control.

**Exit:** Authorization matrix, rate-limit behavior, body limits, and CSRF behavior are exercised in CI and staging.

## Gate 3 — Data durability, privacy, and lifecycle

**Owner:** Platform/data engineering

- Encrypt raw artifacts and backups at rest; document key rotation and access boundaries.
- Define retention, legal hold, deletion, and export policy for raw artifacts, normalized documents, audits, and research missions.
- Make artifact writes content-addressed and append-only with database constraints and integrity verification.
- Run backup and point-in-time restore rehearsals, then reconcile restored hashes and audit-event counts.
- Classify and redact sensitive user-provided material before observability export.

**Exit:** Restore rehearsal meets RPO/RTO targets and integrity reconciliation is recorded.

## Gate 4 — Governance and evidence integrity

**Owner:** Nuru governance owner

- Require each canonical-admission request to identify its exact supporting claim, citation, source registry entry, and evidence-quality assessment.
- Validate that claim, source, candidate, and workspace linkage is exact; reject source-level evidence reuse.
- Test negative paths: stale evidence, unresolved gaps, conflicts, insufficient authority, withdrawn source, and missing human reason.
- Version policy/configuration used by every admission decision and retain the decision trace.
- Conduct a human-review calibration exercise over a representative evidence set.

**Exit:** All negative tests fail closed; governance owner signs the calibration and policy trace.

## Gate 5 — Reliability and operational readiness

**Owner:** SRE/platform

- Instrument source intake, extraction, scheduling, quality, corroboration, conflicts, staleness, and admission with structured logs, metrics, and traces.
- Define SLOs for API availability, queue delay, retrieval failure rate, extraction failure rate, and admission latency.
- Alert on blocked SSRF attempts, authorization failures, rate-limit spikes, migration failures, backlog growth, failed jobs, and canonical-admission denials.
- Add idempotency keys and retry/dead-letter behavior to fetch, extraction, and scheduling workers.
- Load-test expected peak traffic, artifact sizes, frontier sizes, and concurrent review activity.

**Exit:** SLO dashboards and alerts are live; a failure drill and load test meet agreed thresholds.

## Gate 6 — Staging launch rehearsal

**Owner:** Release manager

- Deploy the exact release candidate to staging with production-equivalent authentication, egress controls, secrets, rate-limit backend, and monitoring.
- Execute an end-to-end scenario: source proposal → approval → frontier → scheduled job → governed retrieval → artifact → extraction → claim → citation → quality/corroboration → curator → claim-bound canonical gate.
- Execute adversarial scenarios: cross-workspace access, SSRF, malformed artifact, oversized body, redirect loop, duplicate source, conflict, stale claim, and admission without evidence.
- Verify rollback, incident escalation, and audit retrieval procedures.

**Exit:** Every scenario has a recorded result; no high-severity issue remains open.

## Final go/no-go checklist

Production sign-off requires written approval from Engineering, Security, Data/Privacy, Governance, and SRE. The release is **no-go** if any required gate lacks evidence, any high/critical issue is open, migrations are not rehearsed, or canonical admission can succeed without claim-bound evidence.

