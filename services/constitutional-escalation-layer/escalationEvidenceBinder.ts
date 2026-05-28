import type { ConstitutionalEscalationEvidence } from "@/types/constitutional-escalation-layer";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { hashEscalationValue } from "./escalationHasher";
import type { EscalationTopologySignals } from "./escalationTopologyValidator";

export function bindEscalationEvidence(input: {
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  replay: ReplayReconstructionResult;
  confidenceTooLow: boolean;
  policyMismatch: boolean;
  topologySignals: EscalationTopologySignals;
  generatedAt: string;
}): ConstitutionalEscalationEvidence {
  const triggerIds = input.monitoringModel.triggers.map((trigger) => trigger.triggerId);
  const riskTooHigh = input.monitoringModel.triggers.some((trigger) =>
    (trigger.triggerType === "risk" || trigger.triggerType === "governance" || trigger.triggerType === "replay")
    && (trigger.severity === "high" || trigger.severity === "critical"));
  const replayUnsafe =
    !input.monitoringModel.replayBinding.valid
    || !input.auditEpisode.replayBinding.valid
    || !input.coordinationFramework.replayBinding.valid
    || !input.overrideContract.replayBinding.valid
    || input.replay.status !== "RECONSTRUCTED"
    || !input.replay.integrity.valid;
  const unknownState =
    input.governanceView.state === "DENY"
    || input.monitoringModel.errors.length > 0
    || input.auditEpisode.errors.length > 0
    || input.coordinationFramework.errors.length > 0
    || input.overrideContract.errors.some((error) =>
      error.code === "OVERRIDE_ORDERING_CONFLICT" || error.code === "OVERRIDE_CHAIN_BROKEN");

  const evidenceRefs = Object.freeze([
    input.monitoringModel.triggerHash,
    input.auditEpisode.episodeHash,
    input.coordinationFramework.frameworkHash,
    input.overrideContract.overrideHash,
    input.governanceView.constitutionalDecisionHash,
    input.replay.reconstructionHash,
  ]);

  const suggestedMinimumSeverity =
    replayUnsafe || unknownState || input.topologySignals.recursiveTopology || input.topologySignals.hiddenDelegationPath || input.topologySignals.topologyAmbiguous
      ? "E5"
      : input.policyMismatch || input.topologySignals.authorityDrift
        ? "E4"
        : input.topologySignals.branchFactorOverflow || input.topologySignals.depthOverflow || input.topologySignals.missingOverrideReachability
          ? "E3"
          : riskTooHigh || input.confidenceTooLow
            ? "E2"
            : "E0";

  return Object.freeze({
    evidenceId: hashEscalationValue("constitutional-escalation-evidence-id", {
      episodeHash: input.auditEpisode.episodeHash,
      frameworkHash: input.coordinationFramework.frameworkHash,
      generatedAt: input.generatedAt,
    }),
    evidenceRefs,
    triggerIds: Object.freeze(triggerIds),
    confidenceLineageHash: input.monitoringModel.confidenceEscalation.lineageHash,
    governanceSnapshotHash: input.governanceView.policy.policySnapshotHash,
    overrideLineageHash: input.overrideContract.lineage.lineageId,
    proposalLineageHash: input.auditEpisode.replayBinding.proposalLineageHash,
    snapshotLineageHash: input.auditEpisode.replayBinding.snapshotLineageHash,
    topologyLineageHash: input.coordinationFramework.topology.lineageHash,
    topologyHash: input.coordinationFramework.topology.graphHash,
    replayReconstructionHash: input.replay.reconstructionHash,
    riskTooHigh,
    confidenceTooLow: input.confidenceTooLow,
    policyMismatch: input.policyMismatch,
    replayUnsafe,
    recursiveTopology: input.topologySignals.recursiveTopology,
    hiddenDelegationPath: input.topologySignals.hiddenDelegationPath,
    branchFactorOverflow: input.topologySignals.branchFactorOverflow,
    depthOverflow: input.topologySignals.depthOverflow,
    authorityDrift: input.topologySignals.authorityDrift,
    topologyAmbiguous: input.topologySignals.topologyAmbiguous,
    missingOverrideReachability: input.topologySignals.missingOverrideReachability,
    unknownState,
    suggestedMinimumSeverity,
    createdAt: input.generatedAt,
  });
}
