import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { MonitoringTriggerError, TriggerReplayBinding } from "@/types/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createTriggerError } from "./triggerErrors";

export function bindTriggerReplay(input: {
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
}): { replayBinding: TriggerReplayBinding; errors: readonly MonitoringTriggerError[] } {
  const valid =
    input.proposal.replayBinding.valid
    && input.approvalGraph.replay.valid
    && input.overrideContract.replayBinding.valid
    && input.replay.status === "RECONSTRUCTED"
    && input.replay.lineage.valid
    && input.replay.integrity.valid;

  const replayBinding: TriggerReplayBinding = Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    proposalLineageHash: input.proposal.lineage.lineageId,
    approvalGraphHash: input.approvalGraph.graphHash,
    overrideLineageHash: input.overrideContract.lineage.lineageId,
    snapshotLineageHash: input.proposal.snapshotBinding.snapshotLineageHash,
    replayLineageHash: input.approvalGraph.replay.replayLineageHash,
    deterministic:
      input.proposal.replayBinding.deterministic
      && input.approvalGraph.replay.deterministic
      && input.overrideContract.replayBinding.deterministic,
    valid,
    disputed: !valid,
  });

  const errors: MonitoringTriggerError[] = [];
  if (!valid) {
    errors.push(createTriggerError("TRIGGER_REPLAY_MISMATCH", "Monitoring trigger replay binding is missing or disputed.", "replay"));
  }

  return {
    replayBinding,
    errors: Object.freeze(errors),
  };
}
