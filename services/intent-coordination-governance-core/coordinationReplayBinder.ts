import type { CoordinationGovernanceError, CoordinationReplayBinding } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { IntentCoordinationTopology, CoordinationContainment } from "@/types/intent-coordination-governance-core";
import type { ConstitutionalAutonomyReadinessGateRecord } from "./constitutionalAutonomyReadinessGateAdapter";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { createCoordinationGovernanceError } from "./coordinationErrors";
import { hashCoordinationGovernanceValue } from "./coordinationHasher";

export function bindCoordinationReplay(input: {
  governanceView: ConstitutionalGovernanceView;
  readinessGate: ConstitutionalAutonomyReadinessGateRecord;
  proposal: ProposalRecord;
  escalation: ConstitutionalEscalationRecord;
  replay: ReplayReconstructionResult;
  topology: IntentCoordinationTopology;
  containment: CoordinationContainment;
  lifecycleState: string;
}): Readonly<{
  replayBinding: CoordinationReplayBinding;
  errors: readonly CoordinationGovernanceError[];
}> {
  const valid =
    input.replay.status === "RECONSTRUCTED"
    && input.replay.integrity.valid
    && input.readinessGate.replayBinding.valid
    && input.proposal.replayBinding.valid
    && input.escalation.replayBinding.valid;
  const disputed =
    input.replay.status !== "RECONSTRUCTED"
    || input.readinessGate.replayBinding.disputed
    || input.proposal.replayBinding.disputed
    || input.escalation.replayBinding.disputed;

  const replayBinding: CoordinationReplayBinding = Object.freeze({
    reconstructionHash: input.replay.reconstructionHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    readinessCertificationHash: input.readinessGate.readinessHash,
    escalationLineageHash: input.escalation.lineage.ledgerId,
    proposalLineageHash: input.proposal.lineage.lineageId,
    lifecycleStateHash: hashCoordinationGovernanceValue("intent-coordination-lifecycle-state-hash", input.lifecycleState),
    topologyHash: input.topology.topologyHash,
    containmentHash: hashCoordinationGovernanceValue("intent-coordination-containment-hash", input.containment),
    deterministic: valid,
    valid,
    disputed,
  });

  return Object.freeze({
    replayBinding,
    errors: Object.freeze(
      valid ? [] : [createCoordinationGovernanceError("COORDINATION_REPLAY_MISMATCH", "Intent coordination replay binding is invalid or disputed.", "replayBinding")],
    ),
  });
}
