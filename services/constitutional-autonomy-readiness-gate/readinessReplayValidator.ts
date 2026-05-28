import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessReplay(input: {
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  escalation: ConstitutionalEscalationRecord;
  replay: ReplayReconstructionResult;
}): Readonly<{
  replayValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const replayValid =
    input.proposal.replayBinding.valid
    && input.approvalGraph.replay.valid
    && input.overrideContract.replayBinding.valid
    && input.monitoringModel.replayBinding.valid
    && input.auditEpisode.replayBinding.valid
    && input.coordinationFramework.replayBinding.valid
    && input.escalation.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.integrity.valid;

  const reasons = Object.freeze(
    replayValid ? ["Deterministic replay bindings are intact across the constitutional stack."] : ["Replay lineage is disputed or incomplete."],
  );

  return Object.freeze({
    replayValid,
    reasons,
    errors: Object.freeze(
      replayValid ? [] : [createReadinessError("AUTONOMY_REPLAY_INVALID", "Autonomy readiness requires deterministic replay integrity.", "replay")],
    ),
  });
}
