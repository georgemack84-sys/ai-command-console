import type { CoordinationGovernanceError, IntentCoordinationTopology } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import { createCoordinationGovernanceError } from "./coordinationErrors";

export function detectCoordinationDrift(input: {
  topology: IntentCoordinationTopology;
  proposal: ProposalRecord;
}): readonly CoordinationGovernanceError[] {
  const errors: CoordinationGovernanceError[] = [];
  const validReplayHash = input.proposal.replayBinding.reconstructionHash;
  for (const node of input.topology.nodes) {
    if (node.replayHash !== validReplayHash) {
      errors.push(createCoordinationGovernanceError(
        "COORDINATION_REPLAY_MISMATCH",
        "Coordination node replay hash drift detected.",
        `nodes.${node.intentId}.replayHash`,
      ));
    }
  }
  return Object.freeze(errors);
}
