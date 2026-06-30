# Phase 8K.1 - Certification Contract

## Purpose

Phase 8K.1 establishes the canonical Certification Contract for Controlled Autonomy. It defines the standards, evidence, validation rules, lifecycle, governance requirements, and deterministic decision model every autonomous subsystem must satisfy before production use.

## Implementation

- `types/autonomy-certification-contract.ts` defines certification lifecycle states, decisions, components, domains, evidence, rules, tests, reports, validation, and observability contracts.
- `services/autonomy-certification-contract/index.ts` builds deterministic certification contracts, aggregates Phase 8J visibility certification evidence, validates required/prohibited rules, scores domain results, and enforces fail-closed decisions.
- `app/api/autonomy-certification-contract/*` exposes contract, certification, evidence, lifecycle, rules, tests, domains, and inspect endpoints.
- `tests/unit/autonomy-certification-contract/autonomyCertificationContract.test.ts` verifies doctrine, lifecycle, evidence, domain validation, conditional pass behavior, fail-closed scenarios, stable hashing, and observability.

## Certification Domains

The contract governs planning, orchestration, delegation, runtime supervision, replay, integrity, governance, constitutional compliance, authority enforcement, visibility, tenant isolation, and fail-closed behavior.

## Lifecycle

Certification progresses deterministically from `REGISTERED` through evidence collection, validation, deterministic/replay/integrity/governance/authority/constitutional/visibility/tenant/fail-closed checks, scoring, and final `CERTIFIED` recording.

## Guarantees

The contract rejects mutable certification evidence, hidden validation, governance bypass, authority escalation, replay modification, cross-tenant evidence, missing lineage, incomplete evidence, and fail-open certification.
