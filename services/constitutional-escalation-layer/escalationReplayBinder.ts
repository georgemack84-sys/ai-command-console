import type { ConstitutionalEscalationReplayBinding, ConstitutionalEscalationError } from "@/types/constitutional-escalation-layer";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { createEscalationError } from "./escalationErrors";

export function bindEscalationReplay(input: {
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  replay: ReplayReconstructionResult;
}): Readonly<{
  replayBinding: ConstitutionalEscalationReplayBinding;
  errors: readonly ConstitutionalEscalationError[];
}> {
  const valid =
    input.monitoringModel.replayBinding.valid
    && input.auditEpisode.replayBinding.valid
    && input.coordinationFramework.replayBinding.valid
    && input.overrideContract.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.integrity.valid;
  const disputed =
    input.monitoringModel.replayBinding.disputed
    || input.auditEpisode.replayBinding.disputed
    || input.coordinationFramework.replayBinding.disputed
    || input.overrideContract.replayBinding.disputed
    || input.replay.status !== "RECONSTRUCTED";

  return Object.freeze({
    replayBinding: Object.freeze({
      reconstructionHash: input.replay.reconstructionHash,
      governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
      overrideLineageHash: input.overrideContract.lineage.lineageId,
      auditLineageHash: input.auditEpisode.lineage.ledgerId,
      triggerLineageHash: input.monitoringModel.lineage.lineageId,
      proposalLineageHash: input.auditEpisode.replayBinding.proposalLineageHash,
      confidenceLineageHash: input.monitoringModel.confidenceEscalation.lineageHash,
      topologyLineageHash: input.coordinationFramework.lineage.ledgerId,
      snapshotLineageHash: input.auditEpisode.replayBinding.snapshotLineageHash,
      deterministic: valid && input.coordinationFramework.replayBinding.deterministic,
      valid,
      disputed,
    }),
    errors: Object.freeze(
      valid
        ? []
        : [createEscalationError("ESCALATION_REPLAY_MISMATCH", "Escalation replay binding must remain deterministic and historical.", "replayBinding")],
    ),
  });
}
