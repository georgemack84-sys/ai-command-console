import type { BoundedOrchestrationInput, OrchestrationIsolationScope } from "@/types/bounded-orchestration-framework";

export function buildOrchestrationIsolationScope(input: BoundedOrchestrationInput): OrchestrationIsolationScope {
  return Object.freeze({
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    missionId: input.coordinationRecord.proposalId,
    coordinationId: input.coordinationRecord.coordinationId,
    proposalId: input.coordinationRecord.proposalId,
    containmentState: input.containmentValidation.containmentState === "safe"
      ? "safe"
      : input.containmentValidation.containmentState === "restricted"
        ? "restricted"
        : input.containmentValidation.containmentState === "frozen"
          ? "frozen"
          : "fail_closed",
  });
}
