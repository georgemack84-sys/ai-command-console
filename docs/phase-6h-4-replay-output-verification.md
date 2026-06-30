# Phase 6H.4 Replay Output Verification

Phase 6H.4 verifies a replay-produced output artifact against the expected or original output using a certified Phase 6H.3 state package. It produces a deterministic verification report for later certification and ledger phases.

This phase does not execute replay, generate recommendations, generate governance decisions, recompute risk or confidence, mutate truth records, mutate input bundles or state packages, rewrite evidence or lineage, fetch data, execute tools, or repair mismatches.

## Verification Report

The verification report records replay, tenant, mission, contract, input bundle, state package, produced output, expected output, verification scope, canonicalization context, comparison context, hash verification, structural verification, field verification, governance and authority verification, evidence and lineage verification, recommendation/risk/confidence verification, mismatch report, result, lifecycle, certification state, failure and escalation reasons, audit events, and stable verification hash.

## Matching Rules

Verification checks output presence, provenance, tenant and mission scope, canonical output hash, expected output hash, structure, schema version, field values, governance context, authority boundary, evidence refs, lineage refs, advisory-only state, redaction, and mismatch policy.

Mismatches are recorded when comparison completed but produced output differs from expected output. Failures are recorded when verification cannot safely complete, such as authority expansion, execution authority, source mutation, restricted field exposure, provenance mismatch, or governance bypass.

## Determinism

Produced and expected outputs are canonicalized with stable JSON and SHA256. Verification hashes are stable under reordered object keys and change when output, governance, authority, or mismatch state changes.

## Audit Events

The verifier emits audit event names for request, state package load, output load, expected output resolution, scope verification, canonicalization, hash verification, structure and field verification, governance, authority, evidence, lineage, recommendation, risk/confidence verification, mismatch detection, matched/mismatched/failed/escalated outcome, and report creation.

## Out Of Scope

Replay execution, mismatch root-cause classification, replay ledger execution records, UI surfaces, dashboards, external integrations, autonomous remediation, source mutation, and full replay architecture certification remain out of scope.
