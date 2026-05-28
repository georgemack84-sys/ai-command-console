import type {
  CoordinationFrameworkError,
  CoordinationReplayBinding,
  CoordinationTopologyGraph,
} from "@/types/bounded-coordination-framework";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createCoordinationError } from "./coordinationErrors";

export function bindCoordinationReplay(input: {
  graph: CoordinationTopologyGraph;
  auditEpisode: AutonomyAuditEpisode;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  replay: ReplayReconstructionResult;
}): { replayBinding: CoordinationReplayBinding; errors: readonly CoordinationFrameworkError[] } {
  const valid =
    input.auditEpisode.replayBinding.valid
    && input.overrideContract.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.lineage.valid
    && input.replay.integrity.valid;

  const replayBinding: CoordinationReplayBinding = Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    proposalLineageHash: input.auditEpisode.replayBinding.proposalLineageHash,
    approvalGraphHash: input.auditEpisode.replayBinding.approvalGraphHash,
    overrideLineageHash: input.overrideContract.lineage.lineageId,
    auditEpisodeHash: input.auditEpisode.episodeHash,
    replayLineageHash: input.auditEpisode.replayBinding.reconstructionHash,
    deterministic: input.auditEpisode.replayBinding.deterministic && input.overrideContract.replayBinding.deterministic,
    valid,
    disputed: !valid,
  });

  const errors: CoordinationFrameworkError[] = [];
  if (!valid) {
    errors.push(createCoordinationError("COORDINATION_REPLAY_UNSAFE", "Coordination replay binding is missing or disputed.", "replay"));
  }
  return { replayBinding, errors: Object.freeze(errors) };
}
