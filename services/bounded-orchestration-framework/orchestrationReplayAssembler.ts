import type { BoundedOrchestrationChronologyEntry, BoundedOrchestrationInput, BoundedOrchestrationReplayRecord } from "@/types/bounded-orchestration-framework";
import { hashOrchestrationValue } from "./orchestrationHashEngine";

export function assembleOrchestrationReplay(input: {
  orchestrationInput: BoundedOrchestrationInput;
  chronologyEntries: readonly BoundedOrchestrationChronologyEntry[];
}): BoundedOrchestrationReplayRecord {
  const coordinationRecord = input.orchestrationInput.coordinationRecord;
  const routingResult = input.orchestrationInput.routingResult;
  return Object.freeze({
    replayId: hashOrchestrationValue("replay-id", {
      orchestrationId: input.orchestrationInput.orchestrationId,
      replaySnapshotId: coordinationRecord.replaySnapshotId,
    }),
    orchestrationId: input.orchestrationInput.orchestrationId,
    coordinationId: coordinationRecord.coordinationId,
    governanceSnapshotId: coordinationRecord.governanceSnapshotId,
    replaySnapshotId: coordinationRecord.replaySnapshotId,
    escalationSnapshotId: coordinationRecord.escalationSnapshotId,
    routingLineageId: routingResult.lineage.lineageId,
    routingReplayLogId: routingResult.replayLogId,
    chronologyEntryIds: Object.freeze(input.chronologyEntries.map((entry) => entry.entryId)),
    createdAt: input.orchestrationInput.createdAt,
    replayHash: hashOrchestrationValue("replay-record", {
      governanceSnapshotId: coordinationRecord.governanceSnapshotId,
      replaySnapshotId: coordinationRecord.replaySnapshotId,
      routingReplayLogId: routingResult.replayLogId,
      chronologyEntryIds: input.chronologyEntries.map((entry) => entry.entryId),
    }),
  });
}
