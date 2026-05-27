import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import { evaluateContainmentBoundaries } from "./containmentBoundaries";
import { validateConstitutionalResilience } from "./constitutionalValidation";
import { detectCollapseProbability } from "./collapseDetection";
import { analyzeDegradationPropagation } from "./degradationPropagation";
import { evaluateGovernanceIntegrity } from "./governanceIntegrity";
import { applyResiliencePolicies } from "./resiliencePolicies";
import { scoreResilienceState } from "./resilienceScoring";
import { evaluateRuntimeFreeze } from "./runtimeFreezeController";
import { evaluateStabilization } from "./stabilizationEngine";
import { verifySurvivability } from "./survivabilityVerification";

export function assessConstitutionalResilience(dashboard: RecoveryDashboardReadModel) {
  const governanceDisputes = dashboard.governanceDisputes || [];
  const pendingApprovals = dashboard.pendingApprovals || [];
  const survivability = verifySurvivability(dashboard);
  const governance = evaluateGovernanceIntegrity(dashboard);
  const degradation = analyzeDegradationPropagation(dashboard);
  const containment = evaluateContainmentBoundaries(dashboard);
  const freeze = evaluateRuntimeFreeze(dashboard);
  const stabilization = evaluateStabilization(dashboard);
  const collapse = detectCollapseProbability(dashboard);
  const constitutional = validateConstitutionalResilience(dashboard);

  const base = scoreResilienceState({
    survivabilityScore: survivability.survivabilityScore,
    constitutionalIntegrityScore: clampMetric(
      (governance.governanceIntegrity + (constitutional.valid ? 1 : 0.25)) / 2,
      0.1,
    ),
    operationalRiskScore: clampMetric(
      (degradation.degradationVelocity * 0.35)
        + ((dashboard.continuityConvergence?.divergenceScore ?? 0.25) * 0.25)
        + ((1 - survivability.survivabilityScore) * 0.2)
        + ((dashboard.operationalStabilityAssessment?.recoveryPressure ?? 0.2) * 0.2),
      0.1,
    ),
    collapseProbability: collapse.collapseProbability,
    degradationVelocity: degradation.degradationVelocity,
    governanceIntegrity: governance.governanceIntegrity,
    continuityIntegrity: clampMetric(
      (
        (dashboard.continuityConfidence || 0.25)
        + (dashboard.continuityConvergence?.continuityConfidence ?? 0.25)
      ) / 2,
      0.1,
    ),
    escalationPressure: clampMetric(
      dashboard.operationalStabilityAssessment?.escalationPressure
        ?? (dashboard.escalationCoordination?.frozen ? 0.7 : 0.3),
      0.1,
    ),
    stabilizationConfidence: stabilization.stabilizationConfidence,
    requiresContainment: containment.requiresContainment,
    requiresFreeze: freeze.requiresFreeze,
    requiresEscalation: Boolean(
      dashboard.continuityConvergence?.requiresEscalation
        || dashboard.stewardship?.shouldEscalate
        || collapse.collapseProbability >= 0.65,
    ),
    requiresOperatorIntervention: Boolean(
      governanceDisputes.length > 0
        || pendingApprovals.length > 0
        || dashboard.recoveryPrioritization?.governanceReviewRequired
        || freeze.requiresFreeze,
    ),
    disputedConditions: Array.from(new Set([
      ...survivability.disputed,
      ...governance.disputedConditions,
      ...(governanceDisputes.length > 0 ? ["governance_disputes_present"] : []),
    ])),
    resilienceViolations: Array.from(new Set([
      ...constitutional.violations,
      ...freeze.freezeReasons,
      ...containment.boundaryFailures,
      ...collapse.collapseIndicators,
    ])),
    affectedSubsystems: degradation.affectedSubsystems,
    generatedAt: dashboard.generatedAt,
  });

  return {
    assessment: applyResiliencePolicies(base),
    stabilization,
  };
}

export function buildResilienceAssessmentSnapshot(input: {
  constitutionalIntegrity: number;
  governanceContinuity: number;
  operationalViability: number;
  containmentEffectiveness: number;
  auditPreservationConfidence: number;
  escalationPressure: number;
  systemicInstability: number;
  recoverabilityConfidence: number;
}) {
  return {
    constitutionalIntegrity: clampMetric(input.constitutionalIntegrity, 0.05),
    governanceContinuity: clampMetric(input.governanceContinuity, 0.05),
    operationalViability: clampMetric(input.operationalViability, 0.05),
    containmentEffectiveness: clampMetric(input.containmentEffectiveness, 0.05),
    auditPreservationConfidence: clampMetric(input.auditPreservationConfidence, 0.05),
    escalationPressure: clampMetric(input.escalationPressure, 0.05),
    systemicInstability: clampMetric(input.systemicInstability, 0.05),
    recoverabilityConfidence: clampMetric(input.recoverabilityConfidence, 0.05),
  };
}
