import type { ContainmentReplaySnapshot, CoordinationContainmentInput } from "@/types/coordination-containment";
import { hashContainmentValue } from "./containmentHasher";

export function buildContainmentReplay(input: CoordinationContainmentInput): ContainmentReplaySnapshot {
  const replay = Object.freeze({
    replayId: hashContainmentValue("containment-replay-id", {
      coordinationId: input.coordinationId,
      createdAt: input.createdAt,
    }),
    coordinationId: input.coordinationId,
    missionGraphHash: input.missionGraph.graphHash,
    escalationHash: input.escalationRecord.escalationHash,
    freshnessHash: input.freshnessEvaluation.freshnessHash,
    lifecycleHash: input.lifecycle.record.lifecycleHash,
    interventionSnapshotId: input.humanSupremacySnapshot?.snapshotId ?? input.humanSupremacyRecord?.snapshot.snapshotId,
    createdAt: input.createdAt,
    replayHash: "",
  });
  return Object.freeze({
    ...replay,
    replayHash: hashContainmentValue("containment-replay", replay),
  });
}
