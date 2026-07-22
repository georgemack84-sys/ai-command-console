# Phase 10.14.10 - Dashboard Security & Visibility

## Purpose

Phase 10.14.10 adds the common security and visibility control plane for Adaptive Intelligence dashboards. It decides who may see dashboard records, which tenant and mission data can be displayed, which fields are redacted or denied, and whether replay, lineage, search, aggregation, export, cache, audit, governance, evidence, operator, investigation, and certification access is authorized.

## Implementation

- Added the `DashboardVisibilityDecision` contract and shared taxonomies for classifications, outcomes, permissions, field actions, governance/evidence/operator/investigation/certification visibility, redaction methods, and security alerts.
- Added a deterministic `dashboard-security-visibility/v10.14.10` service with deny-by-default visibility decisions, guard surfaces, secure search and aggregation controls, deterministic redaction/export/cache controls, security ledger evidence, alerting, validation, replay, observability, and contract generation.
- Added read-only API routes for dashboard, contract, decision, policy, tenant, role, mission, fields, guards, search, aggregation, redaction, export, cache, ledger, alerts, validate, and inspect.
- Added certification tests for tenant isolation, role and mission visibility, field-level security, evidence/operator/investigation/certification guards, replay and lineage checks, search/aggregation suppression, export/cache security, immutable ledger evidence, fail-closed behavior, and integrity tamper detection.

## Security Rules

- Access is denied unless an explicit authorization path permits it.
- Tenant context is validated before record, widget, metric, search, filter, replay, lineage, export, cache, or audit data is returned.
- Restricted fields are redacted or omitted server-side and never embedded in hidden client payloads.
- Replay and lineage nodes require independent authorization.
- Search, facets, counts, ordering, pagination, aggregation, metadata, and export paths are treated as possible leakage channels.
- Administrative, audit, certification, governance, and investigation roles do not inherit unrelated visibility by default.
- Missing, ambiguous, expired, conflicting, or unverifiable authorization fails closed.

## Verification

- Focused unit coverage: `tests/unit/dashboard-security-visibility/dashboardSecurityVisibility.test.ts`
- Type coverage: `npm run typecheck`
