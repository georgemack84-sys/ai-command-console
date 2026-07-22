# Mission Control Phase 9.8.1 - Decision Package Contract

## Preview

Phase 9.8.1 defines the canonical operator-facing decision package contract. It establishes the schema, metadata, lifecycle, validation rules, versioning, replay, lineage, integrity model, tenant boundary, governance visibility, constitutional visibility, and advisory-only guarantee required before a package can be presented to an operator.

## Tightened Contract

- Every decision package uses one canonical schema: `OperatorDecisionPackage`.
- Packages are advisory-only and cannot execute actions, approve changes, bypass governance, or elevate authority.
- Lifecycle transitions are deterministic and restricted to the documented state graph.
- Required summaries, replay references, lineage references, metadata, version fields, authority visibility, tenant identity, and integrity hashes are mandatory.
- Invalid, incomplete, unauthorized, non-replayable, or tampered packages fail closed.

## Implementation

- Types: `types/decision-package-contract.ts`
- Service: `services/decision-package-contract/index.ts`
- Tests: `tests/unit/decision-package-contract/decisionPackageContract.test.ts`

## Contract Evidence

The service publishes `getDecisionPackageContractFoundation()`, schema registry creation, package creation, lifecycle state creation, contract validation, replay validation, observability counters, and deterministic hashing for operator decision packages.
