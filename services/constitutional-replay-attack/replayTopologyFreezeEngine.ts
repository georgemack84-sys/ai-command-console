import type { ConstitutionalReplayTopologyRecord } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function buildReplayTopologyRecord(input: {
  replayAttackId: string;
  dependencyLineageId: string;
  topologyDriftDetected: boolean;
}): ConstitutionalReplayTopologyRecord {
  return Object.freeze({
    topologyId: hashConstitutionalReplayValue("topology-id", {
      replayAttackId: input.replayAttackId,
      dependencyLineageId: input.dependencyLineageId,
    }),
    dependencyLineageId: input.dependencyLineageId,
    topologyFrozen: input.topologyDriftDetected,
    topologyDriftDetected: input.topologyDriftDetected,
    topologyHash: hashConstitutionalReplayValue("topology", input),
  });
}
