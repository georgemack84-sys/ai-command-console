# Phase 6H.5 Replay Determinism Gate

Phase 6H.5 is the final decision layer for replay determinism. It consumes the Phase 6H.4 output verification report and assigns exactly one final state: `REPRODUCED`, `MISMATCH`, `INCOMPLETE`, or `INVALID`.

The gate does not execute replay, gather inputs, reconstruct state, compare fields directly, mutate artifacts, repair history, or write the replay ledger. It decides based on certified artifacts and their deterministic evidence.

## Final State Precedence

The gate applies strict precedence:

- `INVALID` overrides all other states when a hard governance, authority, hash, tenant, scope, provenance, or determinism violation exists.
- `INCOMPLETE` applies when required material, certification, expected output, evidence, lineage, governance, schema, or artifact state is missing or unresolved.
- `MISMATCH` applies when the replay chain is complete and valid enough to compare, but output verification found a deterministic difference.
- `REPRODUCED` applies only when all artifacts are present, certified, hash-consistent, complete, deterministic, governed, authority-bounded, evidence-preserving, lineage-preserving, and output verification is matched.

## Gate Report

The gate report records artifact status, hash chain status, completeness, determinism, governance, authority, evidence, lineage, output status, mismatch summary, incompleteness summary, invalidity summary, decision factors, final state, certification eligibility, operator review requirement, escalation requirement, replay execution trust, gate hash, lifecycle state, certification state, and audit events.

## Determinism

Gate decisions use stable canonical JSON and SHA256 hashing. The same gate inputs produce the same gate hash. Changed final state, decision factors, or artifact hashes change the gate hash.

## Out Of Scope

Replay execution, mismatch root-cause analysis, replay ledger persistence, remediation, artifact mutation, and architecture-wide certification remain out of scope.
