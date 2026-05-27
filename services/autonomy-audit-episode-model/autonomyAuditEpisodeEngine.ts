import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { AutonomyAuditEpisode, AuditEpisodeLineageLedger, AutonomyAuditEpisodeError } from "@/types/autonomy-audit-episode-model";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { bindAuditObservation } from "./observationBindingLayer";
import { reconstructInterpretation } from "./interpretationReconstructionEngine";
import { buildRecommendationLineage } from "./recommendationLineageEngine";
import { reconstructRiskAnalysis } from "./riskAnalysisReconstruction";
import { bindApprovalRequirements } from "./approvalRequirementBinder";
import { recordOperatorInteractions } from "./operatorInteractionLedger";
import { reconstructAuditOutcome } from "./outcomeReconstructionEngine";
import { bindAuditReplay } from "./auditReplayBinder";
import { appendAuditEpisodeLedger } from "./auditEpisodeLedger";
import { guardAuditEpisodeInput } from "./auditEpisodeGuards";
import { validateAuditObservation, validateOperatorInteractions } from "./auditEpisodeSchemas";
import { hashAuditEpisodeValue } from "./auditEpisodeHasher";
import { createAuditEpisodeError } from "./auditEpisodeErrors";

export type AutonomyAuditEpisodeInput = Readonly<{
  monitoringModel: MonitoringTriggerModel;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  governanceView: ConstitutionalGovernanceView;
  replay: ReplayReconstructionResult;
  generatedAt: string;
  existingLineage?: AuditEpisodeLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export function buildAutonomyAuditEpisode(input: AutonomyAuditEpisodeInput): AutonomyAuditEpisode {
  const guardErrors = guardAuditEpisodeInput(input);
  const observation = bindAuditObservation({
    monitoringModel: input.monitoringModel,
    createdAt: input.generatedAt,
  });
  const interpretation = reconstructInterpretation({
    observation,
    governanceView: input.governanceView,
    createdAt: input.generatedAt,
  });
  const recommendations = buildRecommendationLineage({
    interpretation,
    monitoringModel: input.monitoringModel,
    createdAt: input.generatedAt,
  });
  const riskAnalysis = reconstructRiskAnalysis({
    monitoringModel: input.monitoringModel,
    createdAt: input.generatedAt,
  });
  const approvalRequirements = bindApprovalRequirements({
    approvalGraph: input.approvalGraph,
    createdAt: input.generatedAt,
  });
  const operatorInteractions = recordOperatorInteractions({
    overrideContract: input.overrideContract,
    createdAt: input.generatedAt,
  });
  const outcome = reconstructAuditOutcome({
    proposal: input.proposal,
    overrideContract: input.overrideContract,
    monitoringModel: input.monitoringModel,
    createdAt: input.generatedAt,
  });
  const replayResult = bindAuditReplay({
    monitoringModel: input.monitoringModel,
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
    overrideContract: input.overrideContract,
    governanceView: input.governanceView,
    replay: input.replay,
  });

  const schemaErrors: AutonomyAuditEpisodeError[] = [
    ...validateAuditObservation(observation),
    ...validateOperatorInteractions(operatorInteractions),
    ...(recommendations.length === 0 ? [createAuditEpisodeError("AUTONOMY_RECOMMENDATION_REPLAY_FAILED", "Audit episode requires deterministic recommendation lineage.", "recommendations")] : []),
    ...(approvalRequirements.length === 0 ? [createAuditEpisodeError("AUTONOMY_APPROVAL_BINDING_INVALID", "Audit episode requires approval requirement bindings.", "approvalRequirements")] : []),
    ...(!riskAnalysis.triggerIds.length ? [createAuditEpisodeError("AUTONOMY_RISK_RECONSTRUCTION_FAILED", "Risk analysis requires trigger lineage.", "riskAnalysis")] : []),
    ...(!input.generatedAt || Number.isNaN(Date.parse(input.generatedAt)) ? [createAuditEpisodeError("AUTONOMY_TIMESTAMP_VIOLATION", "Audit episode timestamp must be immutable and valid.", "generatedAt")] : []),
  ];

  const episodeId = hashAuditEpisodeValue("autonomy-audit-episode-id", {
    proposalId: input.proposal.proposalId,
    triggerHash: input.monitoringModel.triggerHash,
    generatedAt: input.generatedAt,
  });
  const provisionalHash = hashAuditEpisodeValue("autonomy-audit-episode-provisional", {
    episodeId,
    observation,
    interpretation,
    recommendations,
    riskAnalysis,
    approvalRequirements,
    operatorInteractions,
    outcome,
    replayBinding: replayResult.replayBinding,
  });
  const lineageHash = hashAuditEpisodeValue("autonomy-audit-episode-lineage-hash", {
    monitoringLineage: input.monitoringModel.lineage.entries,
    proposalLineage: input.proposal.lineage.entries,
    approvalLineage: input.approvalGraph.lineage.entries,
    overrideLineage: input.overrideContract.lineage.entries,
    replayHash: input.replay.reconstructionHash,
    provisionalHash,
  });
  const errors = Object.freeze([
    ...guardErrors,
    ...schemaErrors,
    ...replayResult.errors,
  ]);
  const episodeHash = hashAuditEpisodeValue("autonomy-audit-episode", {
    episodeId,
    observation,
    interpretation,
    recommendations,
    riskAnalysis,
    approvalRequirements,
    operatorInteractions,
    outcome,
    replayBinding: replayResult.replayBinding,
    lineageHash,
    errors,
  });
  const lineage = appendAuditEpisodeLedger({
    existing: input.existingLineage,
    episodeId,
    episodeHash,
    replayHash: replayResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.generatedAt,
  });

  return Object.freeze({
    episodeId,
    missionId: input.proposal.missionId,
    executionId: input.proposal.executionId,
    proposalId: input.proposal.proposalId,
    observation,
    interpretation,
    recommendations,
    riskAnalysis,
    approvalRequirements,
    operatorInteractions,
    outcome,
    replayBinding: replayResult.replayBinding,
    lineage,
    warnings: Object.freeze([
      ...input.proposal.warnings,
      ...input.approvalGraph.warnings,
      ...input.overrideContract.warnings,
      ...input.monitoringModel.warnings,
      ...(outcome.state === "frozen" ? ["Audit outcome preserves a constitutional freeze recommendation without enforcing it."] : []),
    ]),
    errors,
    episodeHash,
    immutable: true,
  });
}
