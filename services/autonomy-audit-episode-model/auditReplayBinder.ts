import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { AuditReplayBinding, AutonomyAuditEpisodeError } from "@/types/autonomy-audit-episode-model";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createAuditEpisodeError } from "./auditEpisodeErrors";

export function bindAuditReplay(input: {
  monitoringModel: MonitoringTriggerModel;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
}): { replayBinding: AuditReplayBinding; errors: readonly AutonomyAuditEpisodeError[] } {
  const valid =
    input.monitoringModel.replayBinding.valid
    && input.proposal.replayBinding.valid
    && input.approvalGraph.replay.valid
    && input.overrideContract.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.lineage.valid
    && input.replay.integrity.valid;

  const replayBinding: AuditReplayBinding = Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    triggerLineageHash: input.monitoringModel.lineage.lineageId,
    proposalLineageHash: input.proposal.lineage.lineageId,
    approvalGraphHash: input.approvalGraph.graphHash,
    overrideLineageHash: input.overrideContract.lineage.lineageId,
    snapshotLineageHash: input.proposal.snapshotBinding.snapshotLineageHash,
    confidenceStateHash: input.monitoringModel.confidenceEscalation.lineageHash,
    deterministic:
      input.monitoringModel.replayBinding.deterministic
      && input.proposal.replayBinding.deterministic
      && input.approvalGraph.replay.deterministic
      && input.overrideContract.replayBinding.deterministic,
    valid,
    disputed: !valid,
  });

  const errors: AutonomyAuditEpisodeError[] = [];
  if (!valid) {
    errors.push(createAuditEpisodeError("AUTONOMY_REPLAY_MISMATCH", "Autonomy audit replay binding is missing or disputed.", "replay"));
  }
  return { replayBinding, errors: Object.freeze(errors) };
}
