# Phase 9.9.5 - Override Management

## Preview

Override Management captures operator decisions that differ from the system recommendation while preserving the original recommendation permanently. It validates authority, justification, governance, constitutional constraints, tenant and mission ownership, replay references, lineage, and integrity before an override is accepted.

## Tightened Contract

- Overrides are advisory workflow outcomes only; they do not authorize autonomous execution.
- Original recommendations are never overwritten, deleted, or hidden. They are copied into override records and explanation reports for audit and replay.
- Every override requires an operator reason, business justification, mission impact, and supporting evidence reference.
- Executive-level authority is required for override acceptance.
- Governance notifications are deterministic for policy deviation, certification impact, authority escalation, high-risk, regulatory, and constitutional sensitivities.
- Override records, lineage, notifications, explanation reports, ledger entries, and replay outputs are immutable and integrity-protected.
- Missing rationale, invalid authority, failed governance or constitutional validation, invalid workflow context, missing recommendation, replay gaps, lineage gaps, tenant mismatch, tampering, or non-advisory behavior fails closed.

## Implementation

- Types: `types/override-management.ts`
- Service: `services/override-management/index.ts`
- Tests: `tests/unit/override-management/overrideManagement.test.ts`

The service integrates with Phase 9.9.4 Approval Management and preserves the action engine's original recommendation alongside the operator override, governance notification, lineage record, explanation report, and append-only ledger.
