# Phase 10.10.6 - Adaptation Consolidation Engine

## Purpose

The Adaptation Consolidation Engine deterministically identifies relationships between adaptation proposals and organizes eligible proposals into consolidated, evidence-backed recommendations.

It reduces duplicate or fragmented operator review while preserving original proposal intent, evidence lineage, replay lineage, governance context, scoring history, prioritization history, and suppression history.

## Tightened Contract

The implemented contract narrows consolidation to proposal organization only:

- Duplicate, overlapping, and complementary proposals may be consolidated into canonical or coordinated recommendations.
- Conflicting, sequential, and dependent proposals remain independent while explicit relationship metadata is published.
- Every consolidated recommendation preserves all source proposal identifiers, evidence references, replay references, governance references, scoring lineage, prioritization history, and suppression history.
- The engine is deterministic, replayable, tenant isolated, advisory-only, and fail-closed.
- The engine cannot approve, reject, suppress, implement, mutate proposal content, mutate historical records, bypass governance review, or bypass operator review.

## API Surface

- `POST /adaptation-consolidation-engine/consolidate`
- `POST /adaptation-consolidation-engine/groups`
- `POST /adaptation-consolidation-engine/relationships`
- `POST /adaptation-consolidation-engine/explanations`
- `POST /adaptation-consolidation-engine/metrics`
- `POST /adaptation-consolidation-engine/replay`
- `POST /adaptation-consolidation-engine/inspect`
- `GET /adaptation-consolidation-engine/contract`

## Relationship Types

- `DUPLICATE`
- `OVERLAPPING`
- `COMPLEMENTARY`
- `CONFLICTING`
- `SEQUENTIAL`
- `DEPENDENT`
- `INDEPENDENT`

## Deterministic Actions

- `MERGE_CANONICAL`
- `MERGE_RELATED`
- `COORDINATE_RECOMMENDATION`
- `KEEP_SEPARATE_WITH_RELATIONSHIP`
- `KEEP_SEPARATE`
- `EXCLUDE_INELIGIBLE`

## Failure Behavior

Consolidation fails closed when proposal validation, suppression evaluation, evidence lineage, replay lineage, governance analysis, integrity verification, deterministic consolidation, tenant isolation, operator review, or governance review cannot be guaranteed.

It also fails closed for any attempted proposal intent mutation, historical record mutation, conflict merge, approval, rejection, suppression, or implementation.

## Verification

The focused unit suite validates the contract, deterministic replay, relationship taxonomy, lineage preservation, metrics, advisory-only guarantees, and fail-closed behavior.
