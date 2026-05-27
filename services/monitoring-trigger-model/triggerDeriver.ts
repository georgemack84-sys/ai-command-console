import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTrigger, RuntimeObservationSnapshot, TriggerReplayBinding } from "@/types/monitoring-trigger-model";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { deriveConfidenceTrigger } from "./confidenceEscalator";
import { deriveDriftTrigger } from "./driftTriggerEngine";
import { deriveReplayTrigger } from "./replayTriggerEngine";
import { deriveGovernanceTrigger } from "./governanceTriggerEngine";
import { observeRuntimeTrigger } from "./runtimeTriggerObserver";
import { hashTriggerValue } from "./triggerHasher";

export function deriveMonitoringTriggers(input: {
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  replayBinding: TriggerReplayBinding;
  runtimeObservation?: RuntimeObservationSnapshot;
  createdAt: string;
  confidenceScore: number;
  previousConfidenceScore: number;
  lineageHash: string;
}): { triggers: readonly MonitoringTrigger[]; warnings: readonly string[] } {
  const replayBindings = Object.freeze([
    input.replayBinding.reconstructionHash,
    input.replayBinding.replayLineageHash,
    input.replayBinding.snapshotLineageHash,
  ]);
  const governanceBindings = Object.freeze([
    input.governanceView.policy.policySnapshotHash,
    input.governanceView.policy.governanceLineageHash,
    input.governanceView.constitutionalDecisionHash,
  ]);
  const overrideBindings = Object.freeze([
    input.overrideContract.lineage.lineageId,
    input.overrideContract.overrideHash,
    ...(input.overrideContract.killSwitch ? [input.overrideContract.killSwitch.killSwitchId] : []),
  ]);
  const evidenceHashes = Object.freeze([
    input.proposal.proposalHash,
    input.approvalGraph.graphHash,
    input.overrideContract.overrideHash,
    input.replay.reconstructionHash,
  ]);

  const { trigger: confidenceTrigger } = deriveConfidenceTrigger({
    confidenceScore: input.confidenceScore,
    previousConfidenceScore: input.previousConfidenceScore,
    createdAt: input.createdAt,
    replayBindings,
    governanceBindings,
    overrideBindings,
    evidenceHashes,
    lineageHash: input.lineageHash,
  });
  const replayTrigger = deriveReplayTrigger({
    replay: input.replay,
    replayBinding: input.replayBinding,
    confidenceScore: input.confidenceScore,
    governanceBindings,
    overrideBindings,
    createdAt: input.createdAt,
  });
  const governanceTrigger = deriveGovernanceTrigger({
    governanceView: input.governanceView,
    confidenceScore: input.confidenceScore,
    replayBindings,
    overrideBindings,
    createdAt: input.createdAt,
    lineageHash: input.lineageHash,
  });
  const runtimeTrigger = observeRuntimeTrigger({
    runtimeObservation: input.runtimeObservation,
    confidenceScore: input.confidenceScore,
    replayBindings,
    governanceBindings,
    overrideBindings,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });
  const driftTrigger = deriveDriftTrigger({
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    overrideContract: input.overrideContract,
    confidenceScore: input.confidenceScore,
    replayBindings,
    governanceBindings,
    overrideBindings,
    lineageHash: input.lineageHash,
    createdAt: input.createdAt,
  });

  const triggerList = [
    confidenceTrigger,
    replayTrigger,
    governanceTrigger,
    runtimeTrigger,
    driftTrigger,
  ].filter(Boolean) as MonitoringTrigger[];

  const severeCount = triggerList.filter((trigger) => trigger.severity === "high" || trigger.severity === "critical").length;
  if (severeCount >= 2) {
    triggerList.push(Object.freeze({
      triggerId: hashTriggerValue("monitoring-trigger-risk-id", {
        severeCount,
        createdAt: input.createdAt,
        lineageHash: input.lineageHash,
      }),
      triggerType: "risk",
      severity: severeCount > 2 ? "critical" : "high",
      cautionState: severeCount > 2 ? "frozen-recommended" : "escalated",
      confidenceScore: input.confidenceScore,
      replayBindings,
      governanceBindings,
      overrideBindings,
      evidenceHashes,
      lineageHash: input.lineageHash,
      createdAt: input.createdAt,
    }));
  }

  return {
    triggers: Object.freeze(
      triggerList.sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt)
        || left.triggerType.localeCompare(right.triggerType)
        || left.triggerId.localeCompare(right.triggerId)),
    ),
    warnings: Object.freeze(
      input.overrideContract.active ? ["Monitoring triggers reference active override evidence without enforcing it."] : [],
    ),
  };
}
