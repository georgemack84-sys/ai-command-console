import type { CoordinationGovernanceError, CoordinationReplayBinding } from "@/types/intent-coordination-governance-core";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function validateCoordinationReplayBinding(replayBinding: CoordinationReplayBinding): readonly CoordinationGovernanceError[] {
  return Object.freeze(
    replayBinding.valid && replayBinding.deterministic && !replayBinding.disputed
      ? []
      : [createCoordinationGovernanceError("COORDINATION_REPLAY_MISMATCH", "Coordination replay binding must remain valid, deterministic, and undisputed.", "replayBinding")],
  );
}
