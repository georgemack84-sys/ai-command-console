import type {
  ConfidenceEscalation,
  FreezeRecommendation,
  MonitoringTrigger,
  MonitoringTriggerError,
  RuntimeObservationSnapshot,
  TriggerCorrelation,
  TriggerLineageLedger,
  TriggerReplayBinding,
} from "@/types/monitoring-trigger-model";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { validateRuntimeObservation, validateMonitoringTrigger } from "./triggerSchemas";
import { guardMonitoringTriggerInput } from "./triggerGuards";
import { bindTriggerReplay } from "./triggerReplayBinder";
import { deriveMonitoringTriggers } from "./triggerDeriver";
import { correlateTriggers } from "./triggerCorrelationEngine";
import { deriveFreezeRecommendations } from "./freezeRecommendationEngine";
import { appendTriggerLedger } from "./triggerLedger";
import { hashTriggerValue } from "./triggerHasher";
import { createTriggerError } from "./triggerErrors";

export type MonitoringTriggerEngineInput = Readonly<{
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  generatedAt: string;
  confidenceScore: number;
  previousConfidenceScore?: number;
  runtimeObservation?: RuntimeObservationSnapshot;
  existingLineage?: TriggerLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type MonitoringTriggerModel = Readonly<{
  modelId: string;
  triggers: readonly MonitoringTrigger[];
  correlations: readonly TriggerCorrelation[];
  confidenceEscalation: ConfidenceEscalation;
  freezeRecommendations: readonly FreezeRecommendation[];
  replayBinding: TriggerReplayBinding;
  lineage: TriggerLineageLedger;
  warnings: readonly string[];
  errors: readonly MonitoringTriggerError[];
  cautionState: MonitoringTrigger["cautionState"];
  triggerHash: string;
  derivedOnly: true;
}>;

function cautionRank(state: MonitoringTrigger["cautionState"]): number {
  switch (state) {
    case "observe":
      return 0;
    case "restricted":
      return 1;
    case "escalated":
      return 2;
    case "frozen-recommended":
      return 3;
  }
}

export function buildMonitoringTriggerModel(input: MonitoringTriggerEngineInput): MonitoringTriggerModel {
  const runtimeErrors = validateRuntimeObservation(input.runtimeObservation);
  const guardErrors = guardMonitoringTriggerInput({
    governanceView: input.governanceView,
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    overrideContract: input.overrideContract,
    metadata: input.metadata,
  });
  const replayResult = bindTriggerReplay({
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    overrideContract: input.overrideContract,
    governanceView: input.governanceView,
    replay: input.replay,
  });

  const lineageHash = hashTriggerValue("monitoring-trigger-lineage-hash", {
    proposalLineage: input.proposal.lineage.entries,
    approvalLineage: input.approvalGraph.lineage.entries,
    overrideLineage: input.overrideContract.lineage.entries,
    replayHash: input.replay.reconstructionHash,
  });

  const previousConfidenceScore = input.previousConfidenceScore ?? 1;
  const derivation = deriveMonitoringTriggers({
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    overrideContract: input.overrideContract,
    governanceView: input.governanceView,
    replay: input.replay,
    replayBinding: replayResult.replayBinding,
    runtimeObservation: input.runtimeObservation,
    createdAt: input.generatedAt,
    confidenceScore: input.confidenceScore,
    previousConfidenceScore,
    lineageHash,
  });
  const triggerErrors = derivation.triggers.flatMap((trigger) => validateMonitoringTrigger(trigger));
  const correlations = correlateTriggers({
    triggers: derivation.triggers,
    overrideContract: input.overrideContract,
    createdAt: input.generatedAt,
  });
  const correlationErrors = correlations.length > 0 && correlations.some((correlation) => correlation.triggerIds.length < 2)
    ? [createTriggerError("TRIGGER_CORRELATION_INVALID", "Correlations must include at least two triggers.", "correlations")]
    : [];

  const confidenceTrigger = derivation.triggers.find((trigger) => trigger.triggerType === "confidence");
  const confidenceEscalation: ConfidenceEscalation = Object.freeze({
    escalationId: hashTriggerValue("monitoring-trigger-confidence-escalation-id", {
      currentConfidenceScore: input.confidenceScore,
      previousConfidenceScore,
      generatedAt: input.generatedAt,
    }),
    previousConfidenceScore,
    currentConfidenceScore: input.confidenceScore,
    cautionState: confidenceTrigger?.cautionState ?? "observe",
    uncertaintyAmplified: input.confidenceScore < previousConfidenceScore,
    evidenceHashes: Object.freeze(confidenceTrigger?.evidenceHashes ?? []),
    lineageHash,
    createdAt: input.generatedAt,
  });

  const freezeRecommendations = deriveFreezeRecommendations({
    triggers: derivation.triggers,
    correlations,
    createdAt: input.generatedAt,
  });
  const lineage = appendTriggerLedger({
    existing: input.existingLineage,
    triggers: derivation.triggers,
    replayHash: replayResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.generatedAt,
  });

  const errors = Object.freeze([
    ...runtimeErrors,
    ...guardErrors,
    ...replayResult.errors,
    ...triggerErrors,
    ...correlationErrors,
    ...(!Number.isFinite(input.confidenceScore) || input.confidenceScore < 0 || input.confidenceScore > 1
      ? [createTriggerError("TRIGGER_CONFIDENCE_INVALID", "Confidence score must remain within 0..1.", "confidenceScore")]
      : []),
  ]);

  const cautionState = derivation.triggers.reduce<MonitoringTrigger["cautionState"]>(
    (highest, trigger) => cautionRank(trigger.cautionState) > cautionRank(highest) ? trigger.cautionState : highest,
    "observe",
  );

  return Object.freeze({
    modelId: hashTriggerValue("monitoring-trigger-model-id", {
      proposalId: input.proposal.proposalId,
      generatedAt: input.generatedAt,
      lineageHash,
    }),
    triggers: derivation.triggers,
    correlations,
    confidenceEscalation,
    freezeRecommendations,
    replayBinding: replayResult.replayBinding,
    lineage,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.approvalGraph.warnings,
      ...input.overrideContract.warnings,
      ...derivation.warnings,
      ...(input.confidenceScore < previousConfidenceScore ? ["Confidence degradation increased constitutional caution."] : []),
    ]),
    errors,
    cautionState,
    triggerHash: hashTriggerValue("monitoring-trigger-model", {
      triggers: derivation.triggers,
      correlations,
      confidenceEscalation,
      freezeRecommendations,
      replayBinding: replayResult.replayBinding,
      lineage,
      errors,
    }),
    derivedOnly: true,
  });
}
