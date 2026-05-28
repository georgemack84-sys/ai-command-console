import { clampMetric } from "../stability/stabilityMetrics";
import { validateAdvisoryConstraints } from "./advisoryConstraintValidation";
import { runConstitutionalChaosValidation } from "./constitutionalChaosEngine";
import { validateContainment } from "./containmentValidation";
import { validateEscalationSurvivability } from "./escalationSurvivabilityValidation";
import { validateGovernanceMutation } from "./governanceMutationValidation";
import { validateReplayIntegrity } from "./replayIntegrityValidation";
import type { StewardshipValidationResult } from "./types";
import { buildValidationAuditRecord } from "./validationAudit";
import { buildValidationTelemetry } from "./validationTelemetry";
import { dedupeReasons, shouldFreezeValidation } from "./validationPolicies";

export function runStewardshipValidationEngine(input: {
  readiness?: Record<string, unknown>;
  simulationForecast?: Record<string, unknown>;
  decisionIntelligence?: Record<string, unknown>;
  dashboard?: Record<string, unknown>;
  rollback?: Record<string, unknown>;
  convergence?: Record<string, unknown>;
  resilience?: Record<string, unknown>;
  escalationCoordination?: Record<string, unknown>;
  replayVerificationState?: string;
  replayDivergenceCount?: number;
  immutableEvidenceValid?: boolean;
  simulationLineage?: string[];
  auditEvidence?: Array<Record<string, unknown>>;
  conditions?: Array<
    | "lease_loss"
    | "heartbeat_loss"
    | "replay_corruption"
    | "governance_outage"
    | "escalation_storm"
    | "dependency_instability"
    | "stale_ownership_claim"
    | "operator_interruption"
  >;
  timestamp: string;
}): StewardshipValidationResult {
  const advisory = validateAdvisoryConstraints({
    readiness: input.readiness,
    simulationForecast: input.simulationForecast,
    decisionIntelligence: input.decisionIntelligence,
    dashboard: input.dashboard,
  });
  const mutation = validateGovernanceMutation({
    runtimeMutationObserved: false,
    postRoutesDetected: false,
    restrictionReduced: false,
    authorityGranted: false,
  });
  const replay = validateReplayIntegrity({
    replayVerificationState: input.replayVerificationState,
    replayDivergenceCount: input.replayDivergenceCount,
    immutableEvidenceValid: input.immutableEvidenceValid,
    simulationLineage: input.simulationLineage,
    decisionForecastLineageIds: Array.isArray(input.decisionIntelligence?.forecastLineageIds)
      ? (input.decisionIntelligence?.forecastLineageIds as string[])
      : [],
    replayCorrupted: (input.conditions || []).includes("replay_corruption"),
  });
  const escalation = validateEscalationSurvivability({
    escalationCoordination: input.escalationCoordination,
    loopDetected: (input.conditions || []).includes("escalation_storm"),
  });
  const containment = validateContainment({
    convergence: input.convergence,
    resilience: input.resilience,
    readiness: input.readiness,
    containmentVerified: !(input.conditions || []).includes("dependency_instability"),
  });
  const chaos = runConstitutionalChaosValidation({
    conditions: input.conditions || [],
  });

  const blockedReasons = dedupeReasons([
    ...advisory.blockedReasons,
    ...mutation.blockedReasons,
    ...replay.blockedReasons,
    ...escalation.blockedReasons,
    ...containment.blockedReasons,
    ...chaos.blockedReasons,
  ]);

  const freezeActivated = shouldFreezeValidation({
    replayCorrupted: replay.freezeActivated,
    escalationLoopDetected: escalation.freezeActivated,
    containmentFailed: containment.freezeActivated,
    constitutionalBlocked: blockedReasons.includes("governance_outage_detected"),
    operatorAuthorityConflict: blockedReasons.includes("operator_interruption_detected") || blockedReasons.includes("lease_loss_detected"),
  });
  if (freezeActivated) blockedReasons.push("validation_freeze_required");

  const valid = !freezeActivated && blockedReasons.length === 0;
  const auditRecords = [
    buildValidationAuditRecord({
      eventType: "validation.started",
      details: ["stewardship validation started"],
      evidenceRefs: (input.auditEvidence || []).map((entry) => String(entry.id || "")).filter(Boolean).slice(0, 6),
      timestamp: input.timestamp,
    }),
    ...(replay.freezeActivated ? [buildValidationAuditRecord({
      eventType: "validation.replay_corruption_detected",
      details: replay.blockedReasons,
      evidenceRefs: input.simulationLineage || [],
      timestamp: input.timestamp,
    })] : []),
    ...(escalation.freezeActivated ? [buildValidationAuditRecord({
      eventType: "validation.escalation_loop_detected",
      details: escalation.blockedReasons,
      evidenceRefs: escalation.lineageIds,
      timestamp: input.timestamp,
    })] : []),
    ...(containment.containmentActivated ? [buildValidationAuditRecord({
      eventType: "validation.containment_activated",
      details: containment.blockedReasons.length ? containment.blockedReasons : ["containment required"],
      timestamp: input.timestamp,
    })] : []),
    ...(freezeActivated ? [buildValidationAuditRecord({
      eventType: "validation.freeze_activated",
      details: blockedReasons,
      timestamp: input.timestamp,
    })] : []),
    ...(!valid ? [buildValidationAuditRecord({
      eventType: "validation.failed",
      details: blockedReasons,
      timestamp: input.timestamp,
    })] : [buildValidationAuditRecord({
      eventType: "validation.completed",
      details: ["validation completed successfully"],
      timestamp: input.timestamp,
    })]),
  ];

  const telemetry = buildValidationTelemetry({
    governanceReadinessScore: clampMetric(Number(input.readiness?.readinessScore ?? 0) / 100, 0),
    operationalStabilityScore: clampMetric(Number(input.dashboard?.continuityConfidence ?? input.convergence?.continuityConfidence ?? 0.5), 0),
    replayIntegrityConfidence: replay.integrityConfidence,
    rollbackSurvivabilityScore: clampMetric((input.rollback?.guaranteed === true ? 0.85 : 0.2), 0),
    simulationReliabilityScore: clampMetric((input.simulationForecast?.advisoryOnly === true ? 0.8 : 0.2), 0),
    containmentConfidenceScore: containment.containmentConfidence,
    constitutionalDisputeCount: blockedReasons.includes("READINESS_BLOCKED_BY_DISPUTED_TRUTH") ? 1 : 0,
    recoveryConflictRate: clampMetric((input.replayDivergenceCount ?? 0) / 5, 0),
    operatorInterventionRate: blockedReasons.includes("operator_interruption_detected") ? 1 : 0,
    escalationReliabilityScore: escalation.reliabilityScore,
    chaosSurvivabilityScore: clampMetric(1 - ((input.conditions || []).length * 0.12), 0),
    validationFailureRate: valid ? 0 : 1,
    timestamp: input.timestamp,
  });

  return {
    valid,
    advisoryBoundaryIntact: advisory.valid,
    runtimeMutationDetected: !mutation.valid,
    freezeActivated,
    containmentActivated: containment.containmentActivated || chaos.containmentActivated || replay.containmentActivated,
    operatorReviewRequired: advisory.operatorReviewRequired || replay.operatorReviewRequired || escalation.operatorReviewRequired || containment.operatorReviewRequired || chaos.operatorReviewRequired,
    replayIntegrityPreserved: replay.valid,
    escalationIntegrityPreserved: escalation.valid,
    immutableLineagePreserved: replay.blockedReasons.includes("immutable_replay_evidence_invalid") === false,
    blockedReasons: dedupeReasons(blockedReasons),
    auditRecords,
    telemetry,
    timestamp: input.timestamp,
  };
}
