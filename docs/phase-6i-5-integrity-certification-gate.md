# Mission Control Phase 6I.5 - Integrity Certification Gate

Phase 6I.5 adds the final integrity certification layer for Mission Control.

The gate consumes Phase 6I.4 integrity verification results, including evidence produced from the contract, hash chain, and tamper detection phases, then deterministically classifies the requested scope as:

- `VALID` when all required integrity categories pass.
- `DEGRADED` when integrity remains usable only with warnings, skipped optional checks, stale derived indexes, or partial verification.
- `CORRUPTED` when integrity is failed, unverifiable, missing, tenant-drifted, tampered, or otherwise unsafe to trust.

## Implementation

- `services/mission-control/integrityCertificationGate.ts` implements certification classification, degraded-state guardrails, replay permission, governance escalation, operator visibility, result hashing, and append-only ledger projection.
- `services/mission-control/types.ts` defines the gate input, result, certification states, categories, ledger record, and operator visibility report.
- `services/mission-control/index.ts` exports the gate API through the Mission Control barrel.

## Certification Categories

The gate evaluates the required 6I.5 categories:

- Contract Integrity
- Identity Integrity
- Hash Integrity
- Chain Integrity
- Tamper Integrity
- Lineage Integrity
- Evidence Integrity
- Replay Integrity
- Governance Integrity
- Tenant Integrity
- Archive Integrity
- Index Integrity
- Certification Result Integrity

Failed hard-blocker categories force `CORRUPTED`. Warnings or skipped optional checks produce `DEGRADED` only when degraded certification is allowed and full verification is not required.

## Gate Behavior

- `VALID`: certification is allowed and replay is allowed.
- `DEGRADED`: conditional certification is allowed, replay is limited, and operator review is required.
- `CORRUPTED`: certification and replay are blocked, operator review and governance review are required, and escalation is triggered.

Certification results are canonicalized and hash-protected. Ledger records preserve the result hash, optional previous certification hash, target identifiers, findings, category outcomes, and review requirements without mutating source verification material.

## Tests

`tests/unit/mission-control/integrityCertificationGate.test.ts` covers:

- valid record, chain, and tenant-ledger certification
- optional skipped checks, stale indexes, and partial verification degradation
- full-verification and no-degraded guardrails
- hash, chain, tamper, lineage, evidence, replay, governance, tenant, archive, missing-result, invalid-input, and unverifiable corruption paths
- append-only ledger projection
- deterministic result hashing
- previous certification hash linking
- operator visibility
- governance escalation
- replay denial for corrupted scopes
