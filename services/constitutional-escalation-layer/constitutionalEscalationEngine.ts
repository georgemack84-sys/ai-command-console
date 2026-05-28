import type {
  ConstitutionalEscalationError,
  ConstitutionalEscalationLineageLedger,
  ConstitutionalEscalationRecommendation,
  ConstitutionalEscalationState,
  ConstitutionalFreezeRecommendation,
} from "@/types/constitutional-escalation-layer";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { guardEscalationInput } from "./escalationGuards";
import { evaluateEscalationConfidence } from "./escalationConfidenceEngine";
import { validateEscalationPolicy } from "./escalationPolicyValidator";
import { validateEscalationTopology } from "./escalationTopologyValidator";
import { bindEscalationEvidence } from "./escalationEvidenceBinder";
import { bindEscalationReplay } from "./escalationReplayBinder";
import { deriveEscalationSeverity } from "./escalationSeverityEngine";
import { evaluateEscalationContainment } from "./escalationContainmentEvaluator";
import { deriveOversightRecommendation } from "./oversightRecommendationLayer";
import { deriveConstitutionalFreezeRecommendation } from "./constitutionalFreezeRecommendation";
import { validateEscalationRecommendation, validateEscalationTimestamp } from "./escalationSchemas";
import { appendEscalationLineage } from "./escalationLineageLedger";
import { hashEscalationValue } from "./escalationHasher";

function maxEscalationLevel(
  left: import("@/types/constitutional-escalation-layer").EscalationLevel,
  right: import("@/types/constitutional-escalation-layer").EscalationLevel,
) {
  const order = ["E0", "E1", "E2", "E3", "E4", "E5"] as const;
  return order[Math.max(order.indexOf(left), order.indexOf(right))]!;
}

export type ConstitutionalEscalationInput = Readonly<{
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  replay: ReplayReconstructionResult;
  generatedAt: string;
  existingLineage?: ConstitutionalEscalationLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalEscalationRecord = Readonly<{
  state: ConstitutionalEscalationState;
  recommendation: ConstitutionalEscalationRecommendation;
  freezeRecommendation?: ConstitutionalFreezeRecommendation;
  replayBinding: import("@/types/constitutional-escalation-layer").ConstitutionalEscalationReplayBinding;
  lineage: ConstitutionalEscalationLineageLedger;
  warnings: readonly string[];
  errors: readonly ConstitutionalEscalationError[];
  escalationHash: string;
  derivedOnly: true;
}>;

export function buildConstitutionalEscalation(input: ConstitutionalEscalationInput): ConstitutionalEscalationRecord {
  const guardErrors = guardEscalationInput(input);
  const confidenceResult = evaluateEscalationConfidence({
    monitoringModel: input.monitoringModel,
    generatedAt: input.generatedAt,
  });
  const policyResult = validateEscalationPolicy(input.governanceView);
  const topologyResult = validateEscalationTopology(input.coordinationFramework);
  const replayResult = bindEscalationReplay(input);
  const evidence = bindEscalationEvidence({
    ...input,
    confidenceTooLow: confidenceResult.confidenceTooLow,
    policyMismatch: policyResult.policyMismatch,
    topologySignals: topologyResult.signals,
  });
  const severity = deriveEscalationSeverity(evidence);
  const containmentResult = evaluateEscalationContainment(evidence);
  const finalSeverity = maxEscalationLevel(severity, containmentResult.severity);
  const recommendation = deriveOversightRecommendation({
    severity: finalSeverity,
    evidence,
    replayBindingHash: hashEscalationValue("constitutional-escalation-replay-binding-hash", replayResult.replayBinding),
    createdAt: input.generatedAt,
  });
  const recommendationErrors = validateEscalationRecommendation(recommendation);
  const lineageHash = hashEscalationValue("constitutional-escalation-lineage-hash", {
    evidence,
    replayBinding: replayResult.replayBinding,
    coordinationLineage: input.coordinationFramework.lineage.entries,
    auditLineage: input.auditEpisode.lineage.entries,
    overrideLineage: input.overrideContract.lineage.entries,
  });
  const freezeRecommendation = deriveConstitutionalFreezeRecommendation({
    severity: finalSeverity,
    evidence,
    lineageHash,
    createdAt: input.generatedAt,
  });

  const provisionalHash = hashEscalationValue("constitutional-escalation-provisional", {
    recommendation,
    freezeRecommendation,
    evidence,
    replayBinding: replayResult.replayBinding,
  });
  const lineage = appendEscalationLineage({
    existing: input.existingLineage,
    escalationId: recommendation.escalationId,
    escalationHash: provisionalHash,
    replayHash: replayResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.generatedAt,
  });

  const errors: ConstitutionalEscalationError[] = [
    ...guardErrors,
    ...confidenceResult.errors,
    ...policyResult.errors,
    ...topologyResult.errors,
    ...replayResult.errors,
    ...containmentResult.errors,
    ...recommendationErrors,
    ...validateEscalationTimestamp(input.generatedAt, "generatedAt"),
  ];

  const escalationHash = hashEscalationValue("constitutional-escalation-record", {
    recommendation,
    freezeRecommendation,
    replayBinding: replayResult.replayBinding,
    lineage,
    errors,
  });
  const state: ConstitutionalEscalationState = Object.freeze({
    stateId: hashEscalationValue("constitutional-escalation-state-id", {
      escalationHash,
      createdAt: input.generatedAt,
    }),
    activeRecommendation: recommendation,
    freezeRecommendation,
    uncertaintyOnlyIncreasesOversight: true,
    derivedOnly: true,
    createdAt: input.generatedAt,
  });

  return Object.freeze({
    state,
    recommendation,
    freezeRecommendation,
    replayBinding: replayResult.replayBinding,
    lineage,
    warnings: Object.freeze([
      ...input.monitoringModel.warnings,
      ...input.auditEpisode.warnings,
      ...input.coordinationFramework.warnings,
      ...(finalSeverity !== "E0" ? ["Constitutional escalation remains recommendation-only and does not execute interventions."] : []),
    ]),
    errors: Object.freeze(errors),
    escalationHash,
    derivedOnly: true,
  });
}
