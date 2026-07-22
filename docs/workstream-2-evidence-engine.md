# Workstream 2 Evidence Engine

Phase W2.13 establishes the constitutional evidence platform for CAF Legion. It captures, packages, validates, indexes, exposes, and secures evidence for replay, governance, certification, explainability, forensic investigation, and trust evaluation.

## Qualified Baseline

- Phase: `evidence-engine/w2.13`
- Readiness identifier: `W2.13-EVIDENCE-ENGINE-READINESS-001`
- Qualification gate: `Evidence Engine Qualification Gate`
- Passing decision: `EVIDENCE_ENGINE_QUALIFIED`
- Upstream anchors: W2.0 through W2.12

## Contract Surface

- `types/evidence-engine.ts` defines evidence decisions, failure modes, capture, packages, index, validation, provenance, contracts, explorer, runtime integration, APIs, security, readiness, validation, and bundle metadata.
- `services/evidence-engine/index.ts` provides deterministic run, validate, replay, and bundle operations.
- `app/api/evidence-engine/*` exposes authenticated contract, validation, capture, packages, index, validation-engine, provenance, contracts, explorer, runtime-integration, APIs, security, and readiness slices.

## Governance Guarantees

- Runtime events are captured automatically and deterministically.
- Evidence packages are immutable, signed, versioned, deterministic, and replay-compatible.
- Evidence indexes support deterministic retrieval, lineage traversal, provenance search, dependency search, and package discovery.
- Validation checks schema, signature, hash, provenance, lineage, contract, timestamp, completeness, replay compatibility, and cross references.
- Provenance tracks source service, runtime, agent, capability, skill, operator, policy, authority, delegation chain, collaboration chain, parent evidence, and child evidence.
- Evidence access is tenant-isolated, namespace-isolated, authorized, encrypted, tamper-evident, and audit-ready.
