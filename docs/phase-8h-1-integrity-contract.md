# Phase 8H.1 — Integrity Contract

## Summary

Phase 8H.1 establishes the autonomy-wide Integrity Contract. It defines the canonical integrity artifact schema, protected object types, immutable identifiers, protected fields, hash policy, verification rules, lineage preservation rules, replay integrity rules, validation errors, and lifecycle behavior for every protected autonomous artifact.

## Delivered

- Canonical integrity schema for planning, execution, delegation, orchestration, supervision, intervention, replay, and governance decision records.
- Immutable identifier model covering autonomy, execution, replay, decision, planning, orchestration, delegation, supervision, intervention, governance decision, and tenant identifiers.
- Protected field definitions for identity, timestamps, governance references, replay references, lineage references, and integrity hashes.
- Deterministic hash policy covering artifact, payload, metadata, replay, lineage, parent, chain, and verification hashes.
- Lineage model preserving parent, child, ancestor, descendant, replay, execution, planning, decision, and governance ancestry.
- Replay-safe validation that rejects mutation, replay mismatch, lineage corruption, governance gaps, constitutional violations, duplicate identifiers, orphaned artifacts, tenant boundary violations, and schema incompatibility.
- Authenticated API routes under `/api/integrity-contract`.

## API Surface

- `GET /api/integrity-contract/contract`
- `POST /api/integrity-contract/register`
- `POST /api/integrity-contract/validate`
- `POST /api/integrity-contract/hash`
- `POST /api/integrity-contract/lifecycle`
- `POST /api/integrity-contract/classify`
- `GET|POST /api/integrity-contract/inspect`

## Integration

The baseline contract is rooted in the Phase 8G.5 Replay Certification Gate, preserving replay certification evidence, Truth Ledger references, lineage references, governance references, and cryptographic hashes as the foundation for downstream Autonomy Integrity components.
