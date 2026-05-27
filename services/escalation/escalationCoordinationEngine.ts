import type { GovernanceAwareEscalationInput, GovernanceAwareEscalationRecord } from "@/types/escalation";
import { buildEscalationAuthorityContract, enforceEscalationBoundary, createEscalationError } from "./escalationBoundaryEnforcer";
import { validateEscalationGovernance } from "./escalationGovernanceValidator";
import { coordinateUncertaintyState } from "@/services/confidence/uncertaintyStateCoordinator";
import { buildConfidenceRiskProfile } from "@/services/confidence/confidenceRiskModel";
import { persistConfidenceState } from "@/services/confidence/confidenceStatePersistence";
import { mapRiskToEscalation } from "@/services/confidence/riskEscalationMapper";
import { buildEscalationDecision } from "./escalationDecisionEngine";
import { propagateEscalationRecommendations } from "./escalationPropagationManager";
import { validateCoordinationFreezeRecommendation } from "@/services/freeze/coordinationFreezeValidator";
import { validatePauseContainment } from "@/services/pause/pauseContainmentCoordinator";
import { evaluateEscalationContainment } from "./escalationContainmentEngine";
import { coordinateEscalationReplay } from "./escalationReplayCoordinator";
import { buildEscalationLineageEntry } from "./escalationLineageBuilder";
import { appendEscalationLedger } from "./escalationAppendOnlyLedger";
import { inspectEscalationDeterminism } from "./escalationDeterminismInspector";
import { hashEscalationCoordinationValue } from "./escalationHasher";

export function buildGovernanceAwareEscalationRecord(input: GovernanceAwareEscalationInput): GovernanceAwareEscalationRecord {
  const authorityContract = buildEscalationAuthorityContract();
  const boundaryErrors = enforceEscalationBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const governanceErrors = validateEscalationGovernance({
    freshnessStatus: input.freshnessEvaluation.state.freshnessStatus,
    governanceCompatibility: input.freshnessEvaluation.state.governanceCompatibility,
    replayIntegrity: input.freshnessEvaluation.state.replayIntegrity,
    readinessCertified: input.readinessGate.certification.certified,
  });
  const uncertainty = coordinateUncertaintyState({
    freshnessEvaluation: input.freshnessEvaluation,
  });
  const driftRiskScore = Number(Math.min(1, input.freshnessEvaluation.state.detectedDrifts.length / 4).toFixed(4));
  const profile = buildConfidenceRiskProfile({
    coordinationId: input.coordinationId,
    confidenceScore: input.readinessGate.proposalView.confidenceScore,
    replayIntegrityScore:
      input.freshnessEvaluation.state.replayIntegrity === "verified" ? 1
      : input.freshnessEvaluation.state.replayIntegrity === "mismatch" ? 0.4
      : 0,
    governanceAlignmentScore:
      input.freshnessEvaluation.state.governanceCompatibility === "compatible" ? 1
      : input.freshnessEvaluation.state.governanceCompatibility === "review_required" ? 0.5
      : 0,
    approvalClarityScore: input.proposal.approval.valid ? 1 : 0.25,
    driftRiskScore,
    escalationState: uncertainty.escalationState,
    frozen: input.freshnessEvaluation.freeze.frozen,
    paused: input.freshnessEvaluation.state.freshnessStatus === "stale" || input.freshnessEvaluation.state.freshnessStatus === "expired",
    createdAt: input.createdAt,
  });
  const persistedProfile = persistConfidenceState(profile).profile;
  const mapped = mapRiskToEscalation({
    escalationState: persistedProfile.escalationState,
    driftRiskScore: persistedProfile.driftRiskScore,
    uncertaintyScore: persistedProfile.uncertaintyScore,
  });
  const reason = [
    `trigger:${uncertainty.trigger}`,
    `freshness:${input.freshnessEvaluation.state.freshnessStatus}`,
    `replay:${input.freshnessEvaluation.state.replayIntegrity}`,
    `governance:${input.freshnessEvaluation.state.governanceCompatibility}`,
  ].join(";");
  const decision = buildEscalationDecision({
    coordinationId: input.coordinationId,
    trigger:
      uncertainty.trigger === "unknown_state" && governanceErrors.length > 0 ? "policy_uncertainty"
      : uncertainty.trigger,
    resultingState:
      governanceErrors.length > 0 && uncertainty.escalationState === "normal" ? "fail_closed"
      : uncertainty.escalationState,
    severity: mapped.severity,
    freezeRecommended: mapped.freezeRecommended || input.freshnessEvaluation.freeze.frozen,
    pauseRecommended: mapped.pauseRecommended,
    governanceValidated: governanceErrors.length === 0,
    replaySafe: input.freshnessEvaluation.replayRevalidation.replaySafe,
    requiresHumanOversight: mapped.severity !== "low" || governanceErrors.length > 0,
    escalationReason: reason,
    createdAt: input.createdAt,
  });
  const propagation = propagateEscalationRecommendations({
    coordinationId: input.coordinationId,
    freezeRecommended: decision.freezeRecommended,
    pauseRecommended: decision.pauseRecommended,
    reasonCodes: decision.escalationReason.split(";"),
    createdAt: input.createdAt,
  });
  const replay = coordinateEscalationReplay({
    coordinationId: input.coordinationId,
    freshnessHash: input.freshnessEvaluation.freshnessHash,
    lifecycleHash: input.lifecycle.record.lifecycleHash,
    correlationHash: input.correlationComputation.result.resultHash,
    coordinationHash: input.coordinationRecord.coordinationHash,
    readinessHash: input.readinessGate.readinessHash,
    createdAt: input.createdAt,
  });
  const lineageEntry = buildEscalationLineageEntry({
    decision,
    replayGraph: replay.replayGraph,
  });
  const lineage = appendEscalationLedger({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const record: GovernanceAwareEscalationRecord = Object.freeze({
    decision,
    authorityContract,
    confidenceProfile: persistedProfile,
    freezePropagation: propagation.freezePropagation,
    pausePropagation: propagation.pausePropagation,
    replayGraph: replay.replayGraph,
    lineage,
    warnings: Object.freeze([
      ...input.freshnessEvaluation.warnings,
      "Governance-aware escalation remains advisory-only and cannot mutate lifecycle or runtime state.",
    ]),
    errors: Object.freeze([
      ...boundaryErrors,
      ...governanceErrors,
      ...validateCoordinationFreezeRecommendation(propagation.freezePropagation),
      ...validatePauseContainment(propagation.pausePropagation),
    ]),
    escalationHash: "",
    derivedOnly: true,
  });
  const containmentErrors = evaluateEscalationContainment({
    authorityContract,
    decision,
  });
  const reconstructed = coordinateEscalationReplay({
    coordinationId: input.coordinationId,
    freshnessHash: input.freshnessEvaluation.freshnessHash,
    lifecycleHash: input.lifecycle.record.lifecycleHash,
    correlationHash: input.correlationComputation.result.resultHash,
    coordinationHash: input.coordinationRecord.coordinationHash,
    readinessHash: input.readinessGate.readinessHash,
    createdAt: input.createdAt,
    lineage,
  });
  const finalRecord: GovernanceAwareEscalationRecord = Object.freeze({
    ...record,
    replayGraph: reconstructed.replayGraph,
    errors: Object.freeze([
      ...record.errors,
      ...containmentErrors,
      ...replay.errors,
      ...reconstructed.errors,
      ...(!input.freshnessEvaluation.state.detectedDrifts.every((drift) => drift.replaySafe)
        ? [createEscalationError("ESCALATION_REPLAY_AMBIGUITY", "Escalation consumed non-replay-safe drift evidence.", "detectedDrifts")]
        : []),
    ]),
    escalationHash: hashEscalationCoordinationValue("governance-aware-escalation-record", {
      decision,
      authorityContract,
      confidenceProfile: persistedProfile,
      freezePropagation: propagation.freezePropagation,
      pausePropagation: propagation.pausePropagation,
      replayGraph: reconstructed.replayGraph,
      lineage,
    }),
  });
  const determinismErrors = inspectEscalationDeterminism(finalRecord);

  return Object.freeze({
    ...finalRecord,
    errors: Object.freeze([...finalRecord.errors, ...determinismErrors]),
  });
}
