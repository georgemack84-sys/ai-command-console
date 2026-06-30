# Phase 8M.19 Generated Replay Inventory

Status: discovered, pending staged verification and validation

Source: `node scripts/phase-8m-quality-gate.cjs --classify`

## Summary

Generated Replay entries discovered: 39 classifier roots before staging expansion.

Bucket counts:

- API roots: 6.
- App UI roots: 1.
- Component roots: 1.
- Documentation files: 13.
- Service roots: 6.
- Test roots: 6.
- Type files: 6.

Risk: high.

Ownership recommendation: Replay integrity owner with certification authority review.

## File Inventory

Replay API roots:

- `app/api/planning-decision-reconstruction/`
- `app/api/replay-certification-gate/`
- `app/api/replay-contract/`
- `app/api/replay-historical-reconstruction-query/`
- `app/api/replay-integrity-certification-engine/`
- `app/api/replay-viewer/`

Replay UI roots:

- `app/replay-viewer/`
- `components/replay-viewer/`

Replay service roots:

- `services/planning-decision-reconstruction/`
- `services/replay-certification-gate/`
- `services/replay-contract/`
- `services/replay-historical-reconstruction-query/`
- `services/replay-integrity-certification-engine/`
- `services/replay-viewer/`

Replay test roots:

- `tests/unit/planning-decision-reconstruction/`
- `tests/unit/replay-certification-gate/`
- `tests/unit/replay-contract/`
- `tests/unit/replay-historical-reconstruction-query/`
- `tests/unit/replay-integrity-certification-engine/`
- `tests/unit/replay-viewer/`

Replay type files:

- `types/planning-decision-reconstruction.ts`
- `types/replay-certification-gate.ts`
- `types/replay-contract.ts`
- `types/replay-historical-reconstruction-query.ts`
- `types/replay-integrity-certification-engine.ts`
- `types/replay-viewer.ts`

Replay documentation:

- `docs/phase-6h-1-replay-contract.md`
- `docs/phase-6h-2-replay-input-reconstruction.md`
- `docs/phase-6h-3-replay-state-reconstruction.md`
- `docs/phase-6h-4-replay-output-verification.md`
- `docs/phase-6h-5-replay-determinism-gate.md`
- `docs/phase-6j-3-historical-reconstruction.md`
- `docs/phase-6k-2-replay-viewer.md`
- `docs/phase-7l-2-deterministic-replay-validation.md`
- `docs/phase-8g-1-replay-contract.md`
- `docs/phase-8g-3-planning-decision-reconstruction.md`
- `docs/phase-8g-5-replay-certification-gate.md`
- `docs/phase-8i-6-replay-historical-reconstruction-query.md`
- `docs/phase-8k-4-replay-integrity-certification-engine.md`

## Replay Dependency Graph

- Replay Contract packages provide canonical replay identity and immutable evidence.
- Planning Decision Reconstruction consumes Replay Contract evidence to reconstruct planning, decision, delegation, authority, governance, and confidence reasoning without regenerated reasoning.
- Replay Certification Gate certifies deterministic replay readiness.
- Replay Historical Reconstruction Query exposes historical reconstruction evidence.
- Replay Integrity Certification Engine verifies hash integrity and tamper resistance.
- Replay Viewer exposes read-only replay evidence.

## Validation Requirements

- Replay targeted Vitest suites.
- TypeScript.
- Phase 8M classifier.
- Staged-diff guard with zero unexpected paths.

## Architectural Risk

High, because Replay is foundational for deterministic execution, audit reconstruction, certification replay, and forensic analysis. The bundle may be committed only when isolated from Runtime, Governance, Recommendation, Truth Ledger, Planning outside replay reconstruction, and generic Certification domains.
