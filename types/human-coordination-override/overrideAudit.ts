import type { OverrideAuditEventType } from "./overrideStates";

export type OverrideAuditEvent = Readonly<{
  auditId: string;
  coordinationId: string;
  overrideId: string;
  eventType: OverrideAuditEventType;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  reason: string;
  createdAt: string;
  evidenceHash: string;
}>;

export type OverrideReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type OverrideEvidenceRecord = Readonly<{
  evidenceId: string;
  overrideId: string;
  coordinationId: string;
  replayLineageId: string;
  escalationLineageId?: string;
  routingLineageId: string;
  coordinationLineageId: string;
  reasons: readonly string[];
  evidenceHash: string;
}>;
