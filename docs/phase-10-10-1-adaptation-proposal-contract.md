# Phase 10.10.1 — Adaptation Proposal Contract

## Purpose

Defines the canonical, immutable, deterministic, governance-enforced schema for every adaptive proposal in Phase 10.

## Implemented Surface

- `POST /adaptation-proposal-contract/validate`
- `POST /adaptation-proposal-contract/proposal`
- `GET /adaptation-proposal-contract/schema`
- `GET /adaptation-proposal-contract/contract`
- `POST /adaptation-proposal-contract/replay`
- `POST /adaptation-proposal-contract/inspect`

## Contract Coverage

- Proposal identity and ownership
- Proposal scope and intent
- Evidence, outcome, pattern, feedback, replay, and simulation references
- Benefit and risk analysis
- Governance, constitutional, authority, and operator impact analysis
- Simulation, replay, approval, certification, and rollback requirements
- Lifecycle state validation
- Integrity and replay hash verification
- Tenant isolation and advisory-only enforcement

## Fail-Closed Conditions

Validation fails closed for missing identity, tenant, adaptation type, evidence, replay refs, governance analysis, constitutional analysis, authority analysis, benefit analysis, risk analysis, operator impact, invalid lifecycle state, integrity mismatch, cross-tenant references, schema mismatch, incomplete lineage, and every prohibited mutation or operator-bypass attempt.

## Authority Boundary

The contract authorizes proposals only. It cannot mutate production, policy, recommendations, models, governance, confidence, risk, strategy, evidence, or operator authority.
