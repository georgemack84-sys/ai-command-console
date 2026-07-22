# Phase 9.9.8 - Workflow Audit & Replay

## Preview

Workflow Audit & Replay is the forensic record for Phase 9.9 operator workflows. It captures a deterministic, append-only event timeline and certifies that replay can reconstruct the workflow without hidden state or re-executing workflow logic.

## Tightened Contract

- Audit replay records workflow creation, package presentation, operator approval, operator override, review request, escalation, workflow suspension, workflow resumption, governance validation, constitutional validation, authority validation, replay validation, integrity verification, and archive markers.
- Timelines must be ordered by gap-free sequence numbers and cannot contain duplicate event identifiers or duplicate sequence numbers.
- Replay certification requires a complete timeline, archived reconstructed state, governance history, constitutional history, replay references, lineage references, tenant isolation, advisory-only behavior, and valid integrity hashes.
- Missing events, invalid order, duplicate events, incomplete timeline, replay reconstruction failure, replay divergence, missing governance or constitutional history, missing archive marker, replay gaps, lineage gaps, tenant mismatch, tampering, or non-advisory behavior fails closed.
- Replay reconstructs history only; it never re-executes workflow logic or initiates autonomous behavior.

## Implementation

- Types: `types/workflow-audit-replay.ts`
- Service: `services/workflow-audit-replay/index.ts`
- Tests: `tests/unit/workflow-audit-replay/workflowAuditReplay.test.ts`

The service integrates with Phase 9.9.7 Escalation Workflow and certifies a complete immutable audit ledger, timeline, replay record, validation result, replay output, and observability summary.
