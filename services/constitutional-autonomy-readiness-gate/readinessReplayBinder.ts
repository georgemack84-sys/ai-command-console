import type { ConstitutionalReadinessReplayBinding, ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { createReadinessError } from "./readinessErrors";

export function bindReadinessReplay(input: {
  governanceView: ConstitutionalGovernanceView;
  readinessProfile: AutonomyReadinessProfile;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  escalation: ConstitutionalEscalationRecord;
  replay: ReplayReconstructionResult;
}): Readonly<{
  replayBinding: ConstitutionalReadinessReplayBinding;
  errors: readonly ConstitutionalReadinessError[];
}> {
  const valid =
    input.replay.status === "RECONSTRUCTED"
    && input.replay.integrity.valid
    && input.readinessProfile.replayBinding.deterministic
    && !input.readinessProfile.replayBinding.disputed
    && input.proposal.replayBinding.valid
    && input.approvalGraph.replay.valid
    && input.overrideContract.replayBinding.valid
    && input.monitoringModel.replayBinding.valid
    && input.auditEpisode.replayBinding.valid
    && input.coordinationFramework.replayBinding.valid
    && input.escalation.replayBinding.valid;
  const disputed =
    input.readinessProfile.replayBinding.disputed
    || input.proposal.replayBinding.disputed
    || input.approvalGraph.replay.disputed
    || input.overrideContract.replayBinding.disputed
    || input.monitoringModel.replayBinding.disputed
    || input.auditEpisode.replayBinding.disputed
    || input.coordinationFramework.replayBinding.disputed
    || input.escalation.replayBinding.disputed
    || input.replay.status !== "RECONSTRUCTED";

  return Object.freeze({
    replayBinding: Object.freeze({
      reconstructionHash: input.replay.reconstructionHash,
      governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
      approvalLineageHash: input.approvalGraph.lineageHash,
      overrideLineageHash: input.overrideContract.lineage.lineageId,
      escalationLineageHash: input.escalation.lineage.ledgerId,
      auditLineageHash: input.auditEpisode.lineage.ledgerId,
      confidenceLineageHash: input.monitoringModel.confidenceEscalation.lineageHash,
      proposalLineageHash: input.proposal.lineage.lineageId,
      snapshotLineageHash: input.proposal.snapshotBinding.snapshotLineageHash,
      deterministic: valid,
      valid,
      disputed,
    }),
    errors: Object.freeze(
      valid ? [] : [createReadinessError("AUTONOMY_REPLAY_INVALID", "Readiness replay binding is invalid or disputed.", "replayBinding")],
    ),
  });
}
