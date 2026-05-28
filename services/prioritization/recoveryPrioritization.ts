import { clampMetric } from "../stability/stabilityMetrics";
import { buildPrioritizationAuditRecords } from "./prioritizationAudit";
import { validatePrioritizationEvidence } from "./prioritizationConstraints";
import { correlateConvergencePriority } from "./convergencePriorityCorrelation";
import { computeDriftAwarePriority } from "./driftAwarePrioritization";
import { evaluatePrioritizationGovernance } from "./prioritizationGovernance";
import { applyPrioritizationPolicies } from "./prioritizationPolicies";
import { buildPrioritizationQueue } from "./prioritizationQueue";
import { scoreRecoveryCandidate } from "./prioritizationScoring";
import { buildPrioritizationTelemetry } from "./prioritizationTelemetry";
import { assignDeterministicRanks } from "./prioritizationTieBreaking";
import type {
  RecoveryPrioritizationInput,
  RecoveryPrioritizationResult,
} from "./prioritizationTypes";
import { detectRecoveryStarvation } from "./recoveryStarvationPrevention";
import { analyzeSurvivabilityPriority } from "./survivabilityPriorityAnalysis";

export function prioritizeRecoveries(input: RecoveryPrioritizationInput): RecoveryPrioritizationResult {
  const validation = validatePrioritizationEvidence(input);
  if (!validation.ok) {
    return {
      prioritizationApproved: false,
      deterministicOrderingVerified: false,
      governanceReviewRequired: true,
      containmentPriorityRequired: false,
      survivabilityPriorityRequired: false,
      recoveryQueue: [],
      blockedRecoveries: input.candidates.map((candidate) => candidate.executionId),
      disputedRecoveries: [],
      prioritizationConfidence: 0.1,
      prioritizationReasons: validation.issues,
      timestamp: input.timestamp,
      assessments: [],
      starvationWarnings: [],
      auditRecords: [],
      telemetryEvents: [],
    };
  }

  const convergenceSignals = correlateConvergencePriority(input.convergence);
  const survivability = analyzeSurvivabilityPriority(input.stability);
  const drift = computeDriftAwarePriority({
    convergence: input.convergence,
    stability: input.stability,
  });

  const scored = input.candidates.map((candidate) => scoreRecoveryCandidate({
    candidate,
    convergence: {
      ...convergenceSignals,
      runtimeDriftSeverity: Math.max(convergenceSignals.runtimeDriftSeverity, drift.runtimeDriftSeverity),
      containmentPressure: Math.max(convergenceSignals.containmentPressure, drift.containmentPressure),
    },
    survivabilityImpact: Math.max(
      survivability.survivabilityImpact,
      clampMetric(candidate.survivabilityImpact, survivability.survivabilityImpact),
    ),
    timestamp: candidate.createdAt || input.timestamp,
  }));

  const policyApplied = scored.map((assessment) => applyPrioritizationPolicies(assessment));
  const ranked = assignDeterministicRanks(policyApplied);
  const governance = evaluatePrioritizationGovernance({
    assessments: ranked,
    input,
  });
  const starvationWarnings = detectRecoveryStarvation({
    rankedAssessments: ranked,
    candidates: input.candidates,
    tenantId: input.tenantId,
  });
  const queue = buildPrioritizationQueue(ranked);
  const auditRecords = buildPrioritizationAuditRecords(ranked);
  const telemetryEvents = buildPrioritizationTelemetry(ranked, input.timestamp);

  return {
    prioritizationApproved: !governance.freezePrioritization && queue.recoveryQueue.length > 0,
    deterministicOrderingVerified: true,
    governanceReviewRequired: governance.governanceReviewRequired,
    containmentPriorityRequired: ranked.some((assessment) => assessment.state === "CONTAINED"),
    survivabilityPriorityRequired: survivability.survivabilityPriorityRequired,
    recoveryQueue: queue.recoveryQueue,
    blockedRecoveries: queue.blockedRecoveries,
    disputedRecoveries: queue.disputedRecoveries,
    prioritizationConfidence: clampMetric(
      (convergenceSignals.convergenceConfidence + (input.stability?.confidence || 0.35) + (governance.freezePrioritization ? 0.1 : 0.7)) / 3,
      0.15,
    ),
    prioritizationReasons: Array.from(new Set([
      ...governance.warnings,
      ...survivability.reasons,
      ...convergenceSignals.warnings,
    ])),
    timestamp: input.timestamp,
    assessments: governance.freezePrioritization
      ? ranked.map((assessment) => ({ ...assessment, state: assessment.state === "RANKED" ? "FROZEN" : assessment.state }))
      : ranked,
    starvationWarnings,
    auditRecords,
    telemetryEvents,
  };
}
