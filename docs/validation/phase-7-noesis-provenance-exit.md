# Phase 7 — Noesis Provenance exit record

**Status:** Accepted  
**Canonical system identity:** `Noesis` (`agent:noesis`)  
**Core invariant:** No durable knowledge without traceable provenance.

## Exit-gate evidence

| Requirement | Acceptance evidence |
| --- | --- |
| Canonical identity migration | `Noesis` and `agent:noesis` are the system identity; Learning Agent remains a role/classification only. |
| Immutable original teaching | Teaching events preserve source actor, source type, original content, receipt time, scope hint, and immutability. |
| Separate interpretation and candidate | Extraction and candidate records reference sources instead of rewriting them. |
| Authority, evidence, and approval | Human approvals and evidence sets are separate immutable provenance records. |
| Durable lineage | The integrity acceptance scenario reconstructs `TE-1 → EX-1 → CP-P-1 → HA-P-1 → P-1` and marks it `TRUSTED`. |
| Historical correction | The supersession scenario preserves `P-17` unchanged and records `P-42` as its current successor using `SUPERSEDES` and `SUPERSEDED_BY` relationships. |
| Query and explanation | Authenticated provenance endpoints expose record explanation and historical state without granting mutation access. |
| Fail-closed integrity | Incomplete lineage is quarantined; it cannot be treated as trusted or promoted as durable knowledge. |
| Persistent delivery | Prisma schema and migrations persist the ledger; production build, migration, startup governor, authentication, and dashboard shakedown passed. |

## Verified acceptance suites

The Phase 7 acceptance scenarios are maintained in:

- `tests/unit/learning-constitution/provenance.test.ts`
- `tests/unit/learning-constitution/provenanceIntegrity.test.ts`
- `tests/unit/learning-constitution/provenanceSupersession.test.ts`
- `tests/unit/learning-constitution/provenanceRelationshipService.test.ts`
- `tests/unit/learning-constitution/teachingEventCapture.test.ts`
- `tests/unit/learning-constitution/approvalEvidenceProvenance.test.ts`

These cover full lineage reconstruction, immutable source history, multiple-source relationships, evidence and approval, integrity quarantine, and non-destructive correction.

## Operational note

An external alert webhook remains an optional production enhancement. It does not affect Phase 7 provenance correctness or its exit gate; the application continues to surface critical alerts in-app until a webhook is configured.
