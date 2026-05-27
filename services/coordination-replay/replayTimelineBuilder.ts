import type { CoordinationReplayInput, CoordinationReplayTimelineEntry } from "@/types/coordination-replay";
import { hashCoordinationReplayValue } from "./replayHashEngine";

export function buildReplayTimelineEntries(input: CoordinationReplayInput): readonly CoordinationReplayTimelineEntry[] {
  const entries: CoordinationReplayTimelineEntry[] = [
    Object.freeze({
      entryId: hashCoordinationReplayValue("timeline-governance-entry", input.coordinationRecord.governanceBinding),
      source: "governance",
      sourceRecordId: input.coordinationRecord.governanceBinding.governanceLineageId,
      createdAt: input.coordinationRecord.createdAt,
      deterministicHash: input.coordinationRecord.governanceBinding.bindingHash,
    }),
    Object.freeze({
      entryId: hashCoordinationReplayValue("timeline-approval-entry", input.approval),
      source: "approval",
      sourceRecordId: input.approval.approvalId,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("approval-entry-hash", input.approval),
    }),
    Object.freeze({
      entryId: hashCoordinationReplayValue("timeline-routing-entry", input.routingResult.replayLog),
      source: "routing",
      sourceRecordId: input.routingResult.lineageRecordId,
      createdAt: input.routingResult.replayLog.createdAt,
      deterministicHash: input.routingResult.replayLog.deterministicHash,
    }),
    Object.freeze({
      entryId: hashCoordinationReplayValue("timeline-escalation-entry", input.coordinationRecord.escalationBinding ?? {}),
      source: "escalation",
      sourceRecordId: input.coordinationRecord.escalationBinding?.escalationLineageId ?? "none",
      createdAt: input.coordinationRecord.escalationBinding?.createdAt ?? input.createdAt,
      deterministicHash: input.coordinationRecord.escalationBinding?.bindingHash
        ?? hashCoordinationReplayValue("empty-escalation-binding", input.coordinationRecord.coordinationId),
    }),
    Object.freeze({
      entryId: hashCoordinationReplayValue("timeline-orchestration-entry", input.orchestrationRecord.replay),
      source: "orchestration",
      sourceRecordId: input.orchestrationRecord.orchestrationId,
      createdAt: input.orchestrationRecord.createdAt,
      deterministicHash: input.orchestrationRecord.deterministicHash,
    }),
  ];

  return Object.freeze(entries.sort((left, right) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }
    return left.entryId.localeCompare(right.entryId);
  }));
}
