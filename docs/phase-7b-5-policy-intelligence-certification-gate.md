# Mission Control Phase 7B.5 - Policy Intelligence Certification Gate

## Purpose

Phase 7B.5 certifies that the full Policy Intelligence Engine is deterministic, explainable, replayable, tenant-safe, governance-compliant, truth-linked, lineage-preserving, conflict-aware, impact-aware, operator-visible, and historically reproducible.

The gate certifies outputs from:

- 7B.1 Policy Analysis Contract
- 7B.2 Policy Correlation Engine
- 7B.3 Policy Dependency Graph
- 7B.4 Policy Impact Analysis

Unsupported policy intelligence fails closed.

## Certification Contract

The canonical record is `PolicyIntelligenceCertification`, defined in `types/policy-intelligence-certification.ts`.

It includes:

- certification identity
- tenant scope
- certification scope and version
- policy analysis refs
- policy correlation refs
- policy dependency graph refs
- policy impact analysis refs
- Truth Ledger, evidence, lineage, and replay refs
- structured test results
- validation failures
- conditional findings
- lifecycle state
- certification state
- deterministic certification hash

## Certification Categories

The suite runs twelve categories:

- contract validation
- schema validation
- lineage validation
- correlation validation
- dependency graph validation
- inheritance validation
- conflict detection validation
- supersession validation
- impact explanation validation
- governance influence validation
- replay validation
- tenant, identity, and truth validation

## Decision Rules

`PASS` requires all critical tests to pass.

`CONDITIONAL_PASS` is allowed only for minor operator-visible findings that do not compromise determinism, replay, tenant isolation, identity immutability, truth preservation, or governance integrity.

`FAIL` is forced by any critical failure, including missing contracts, invalid schemas, lineage breaks, inconsistent correlations, graph mismatches, undetected conflicts, unexplained impacts, replay mismatch, tenant isolation failure, identifier mutation, or truth lineage mismatch.

## API Surface

Phase 7B.5 exposes:

- `GET /api/policy-intelligence-certification/contract`
- `POST /api/policy-intelligence-certification/run`
- `POST /api/policy-intelligence-certification/validate`
- `POST /api/policy-intelligence-certification/hash`
- `POST /api/policy-intelligence-certification/replay`
- `POST /api/policy-intelligence-certification/report`
- `POST /api/policy-intelligence-certification/ledger`
- `GET|POST /api/policy-intelligence-certification/inspect`

All routes require an authenticated workspace member.

## Phase 7B Exit

When the certification state is `PASS`, Phase 7B is ready to close. Mission Control can safely use Policy Intelligence as a certified Governance Intelligence input because policy representation, correlation, dependency graphing, impact analysis, lineage, replay, tenant isolation, and Truth Ledger references have all been verified.
