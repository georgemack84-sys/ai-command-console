import type {
  CoordinationReplayBinding,
  CoordinationReplayReconstruction,
  IntentCoordinationGovernanceRecord,
} from "@/types/intent-coordination-governance-core";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function reconstructCoordinationReplay(record: IntentCoordinationGovernanceRecord): CoordinationReplayReconstruction {
  const replayBinding: CoordinationReplayBinding = Object.freeze({
    ...record.replayBinding,
  });

  return Object.freeze({
    reconstructionId: hashCoordinationGovernanceValue("intent-coordination-replay-reconstruction-id", {
      coordinationId: record.coordinationId,
      replayHash: replayBinding.reconstructionHash,
    }),
    coordinationHash: record.coordinationHash,
    replayBinding,
    topologyHash: record.topology.topologyHash,
    lifecycleState: record.state,
    deterministic: true,
  });
}
