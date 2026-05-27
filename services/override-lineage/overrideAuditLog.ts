import type {
  HumanCoordinationOverrideInput,
  OverrideAuditEvent,
  OverrideEvidenceRecord,
} from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function buildEvent(
  input: HumanCoordinationOverrideInput,
  evidence: OverrideEvidenceRecord,
  eventType: OverrideAuditEvent["eventType"],
): OverrideAuditEvent {
  const base = Object.freeze({
    coordinationId: input.coordinationRecord.coordinationId,
    overrideId: input.overrideId,
    eventType,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    reason: input.reason,
    createdAt: input.createdAt,
  });
  return Object.freeze({
    auditId: hashCoordinationReplayValue("human-override-audit-id", base),
    ...base,
    evidenceHash: evidence.evidenceHash,
  });
}

export function buildOverrideAuditEvents(
  input: HumanCoordinationOverrideInput,
  evidence: OverrideEvidenceRecord,
): readonly OverrideAuditEvent[] {
  const primaryEvent = input.overrideType === "pause"
    ? "coordination.paused"
    : input.overrideType === "deny"
      ? "coordination.denied"
      : input.overrideType === "freeze"
        ? "orchestration.frozen"
        : "routing.revoked";

  return Object.freeze([
    buildEvent(input, evidence, primaryEvent),
    buildEvent(input, evidence, "override.reviewed"),
    buildEvent(input, evidence, "override.replayed"),
    buildEvent(input, evidence, "escalation.inspected"),
    buildEvent(input, evidence, "governance.audit.performed"),
  ]);
}
