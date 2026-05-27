import { clampMetric } from "../stability/stabilityMetrics";
import { evaluateSurvivabilityConstraints } from "./survivabilityConstraints";
import { evaluateConstitutionalContinuity } from "./constitutionalContinuity";
import { assessConstitutionalSurvivability } from "./survivabilityAssessment";
import { determineIsolationBoundaries } from "./survivabilityIsolation";
import { determineDegradationMode } from "./degradationController";
import { evaluateEmergencyStabilization } from "./emergencyStabilization";
import { assessOperationalContainment, type OperationalContainmentAssessment } from "../containment/operationalContainment";
import { coordinateSurvivability } from "./survivabilityCoordinator";
import { buildContainmentEscalation } from "../containment/containmentEscalation";
import { buildSurvivabilityProtocols } from "../containment/survivabilityProtocols";
import { buildContainmentAuditRecord } from "../containment/containmentAudit";

export type ConstitutionalSurvivabilityAssessment = {
  assessmentId: string;
  survivabilityState: import("./survivabilityPolicies").SurvivabilityState;
  constitutionalIntegrity: number;
  governanceContinuity: number;
  operationalViability: number;
  containmentEffectiveness: number;
  auditPreservationConfidence: number;
  escalationPressure: number;
  systemicInstability: number;
  recoverabilityConfidence: number;
  isolatedDomains: string[];
  failingDomains: string[];
  survivableDomains: string[];
  emergencyControlsRequired: boolean;
  operatorInterventionRequired: boolean;
  constitutionalRiskDetected: boolean;
  createdAt: number;
};

export function runConstitutionalSurvivabilityFramework(input: {
  governance: {
    constitutionalState: string;
    governanceConfidence: number;
    escalationRequired: boolean;
    containmentRequired: boolean;
    violations: string[];
  };
  sovereignty: {
    sovereigntyState: string;
    governanceIntegrity: number;
    survivabilityConfidence: number;
    systemicRisk: number;
    containmentEffectiveness: number;
    escalationPressure: number;
    emergencyControlsRequired: boolean;
    unstableDomains: string[];
  };
  continuity: {
    survivable: boolean;
    survivabilityScore: number;
    collapseRisk: number;
    containmentConfidence: number;
    continuityTrajectory: string;
  };
  enforcement: {
    executable: boolean;
    enforcementState: string;
    blockedReasons: string[];
    containmentApplied: boolean;
    escalationTriggered: boolean;
    emergencyLockActive: boolean;
    enforcementConfidence: number;
  };
  coordination: {
    coordinationState: string;
    coordinationRisk: number;
    deniedActions: string[];
    requiredOversight: string[];
  };
  supervision: {
    supervisionState: string;
    supervisedExecutionAllowed: boolean;
    stabilizationRecommended: boolean;
    escalationRequired: boolean;
    containmentRequired: boolean;
    operationalRisk: number;
    supervisionConfidence: number;
  };
  replayReview: {
    reviewState: string;
    divergenceCount: number;
    blockedReasons: string[];
  };
  disputeReview: {
    reviewState: string;
    unresolvedDisputes: string[];
  };
  auditHistoryLength: number;
  degradedSystems: string[];
  nowMs: number;
}) : {
  assessment: ConstitutionalSurvivabilityAssessment;
  containment: OperationalContainmentAssessment;
  degradation: ReturnType<typeof determineDegradationMode>;
  emergencyStabilization: ReturnType<typeof evaluateEmergencyStabilization>;
  escalation: ReturnType<typeof buildContainmentEscalation>;
  protocols: ReturnType<typeof buildSurvivabilityProtocols>;
  coordination: ReturnType<typeof coordinateSurvivability>;
  containmentAudit: ReturnType<typeof buildContainmentAuditRecord>;
  blockedReasons: string[];
} {
  const disputed = input.disputeReview.unresolvedDisputes.length > 0 || input.replayReview.reviewState === "FROZEN";
  const freezeActive = input.enforcement.emergencyLockActive || input.replayReview.blockedReasons.length > 0;
  const continuity = evaluateConstitutionalContinuity({
    governanceConfidence: input.governance.governanceConfidence,
    constitutionalIntegrity: input.sovereignty.governanceIntegrity,
    auditHistoryLength: input.auditHistoryLength,
    disputedTruthPresent: disputed,
  });
  const constraints = evaluateSurvivabilityConstraints({
    constitutionalIntegrity: input.sovereignty.governanceIntegrity,
    governanceContinuity: continuity.governanceContinuity,
    auditPreservationConfidence: continuity.auditPreservationConfidence,
    disputed,
    freezeActive,
  });

  const operationalViability = clampMetric(
    input.continuity.survivabilityScore * 0.35
      + (input.enforcement.executable ? 0.15 : 0.04)
      + (input.supervision.supervisedExecutionAllowed ? 0.15 : 0.05)
      + (1 - input.coordination.coordinationRisk) * 0.2
      + input.supervision.supervisionConfidence * 0.15,
    0.05,
  );
  const systemicInstability = clampMetric(
    input.sovereignty.systemicRisk * 0.4
      + input.coordination.coordinationRisk * 0.2
      + (1 - input.continuity.survivabilityScore) * 0.2
      + (input.replayReview.divergenceCount > 0 ? 0.1 : 0)
      + (disputed ? 0.15 : 0.02),
    0.05,
  );
  const recoverabilityConfidence = clampMetric(
    input.continuity.survivabilityScore * 0.45
      + input.sovereignty.survivabilityConfidence * 0.25
      + input.enforcement.enforcementConfidence * 0.15
      + continuity.auditPreservationConfidence * 0.15
      - (disputed ? 0.2 : 0),
    0.05,
  );

  const isolation = determineIsolationBoundaries({
    unstableDomains: Array.from(new Set([...input.degradedSystems, ...input.sovereignty.unstableDomains])),
    failingDomains: Array.from(new Set([
      ...(input.enforcement.blockedReasons.length > 0 ? ["enforcement"] : []),
      ...(input.replayReview.blockedReasons.length > 0 ? ["replay"] : []),
      ...(input.disputeReview.unresolvedDisputes.length > 0 ? ["governance"] : []),
    ])),
    dependencyCollapseRisk: Math.max(input.coordination.coordinationRisk, input.continuity.collapseRisk),
    tenantSurvivabilityRisk: systemicInstability,
  });

  const assessment = assessConstitutionalSurvivability({
    constitutionalIntegrity: input.sovereignty.governanceIntegrity,
    governanceContinuity: continuity.governanceContinuity,
    operationalViability,
    containmentEffectiveness: input.sovereignty.containmentEffectiveness,
    auditPreservationConfidence: continuity.auditPreservationConfidence,
    escalationPressure: input.sovereignty.escalationPressure,
    systemicInstability,
    recoverabilityConfidence,
    unstableDomains: isolation.isolatedDomains,
    failingDomains: isolation.quarantinedDomains.length > 0 ? isolation.quarantinedDomains : isolation.isolatedDomains,
    survivableDomains: input.degradedSystems.filter((domain) => !isolation.isolatedDomains.includes(domain)),
    disputed,
    freezeActive,
    emergencyControlsRequired: input.sovereignty.emergencyControlsRequired || input.enforcement.emergencyLockActive,
    operatorInterventionRequired: input.coordination.requiredOversight.length > 0 || input.enforcement.blockedReasons.length > 0,
    constitutionalRiskDetected: input.governance.violations.length > 0 || disputed,
    nowMs: input.nowMs,
  });
  assessment.isolatedDomains = isolation.isolatedDomains;

  const containment = assessOperationalContainment({
    survivabilityState: assessment.survivabilityState,
    systemicInstability,
    governanceCollapseRisk: 1 - continuity.governanceContinuity,
    survivabilityConfidence: recoverabilityConfidence,
    containmentEffectiveness: input.sovereignty.containmentEffectiveness,
    escalationPressure: input.sovereignty.escalationPressure,
    operationalDivergenceRisk: input.coordination.coordinationRisk,
    dependencyCollapseRisk: Math.max(input.coordination.coordinationRisk, input.continuity.collapseRisk),
    constitutionalConflictSpreadRisk: disputed ? 0.9 : input.coordination.coordinationRisk,
    tenantSurvivabilityRisk: systemicInstability,
    unstableDomains: isolation.isolatedDomains,
    nowMs: input.nowMs,
  });

  const emergencyStabilization = evaluateEmergencyStabilization({
    survivabilityState: assessment.survivabilityState,
    constitutionalState: input.governance.constitutionalState,
    containmentRequired: containment.containmentRequired,
    emergencyLockActive: input.enforcement.emergencyLockActive,
    governanceAllowed: input.governance.violations.length === 0 && constraints.allowed,
  });
  const degradation = determineDegradationMode({
    survivabilityState: assessment.survivabilityState,
    systemicInstability,
    governancePriorityRequired: continuity.governanceContinuity < 0.55,
    containmentPriorityRequired: containment.containmentRequired,
    auditPriorityRequired: continuity.auditPreservationConfidence < 0.55,
    currentAutonomyLevel: "FULL_AUTONOMY",
  });
  const escalation = buildContainmentEscalation({
    recommendedAction: containment.recommendedAction,
    emergencyStabilizationRequired: containment.emergencyStabilizationRequired || emergencyStabilization.required,
    operatorInterventionRequired: containment.operatorInterventionRequired,
    unstableDomains: containment.isolatedDomains,
  });
  const protocols = buildSurvivabilityProtocols({
    recommendedAction: containment.recommendedAction,
    containmentRequired: containment.containmentRequired,
    emergencyStabilizationRequired: containment.emergencyStabilizationRequired || emergencyStabilization.required,
    operatorInterventionRequired: containment.operatorInterventionRequired,
  });

  const blockedReasons = Array.from(new Set([
    ...constraints.blockedReasons,
    ...input.enforcement.blockedReasons,
    ...input.replayReview.blockedReasons,
    ...input.disputeReview.unresolvedDisputes,
  ])).sort();

  const coordination = coordinateSurvivability({
    assessment,
    containment,
    blockedReasons,
    timestamp: new Date(input.nowMs).toISOString(),
  });
  const containmentAudit = buildContainmentAuditRecord({
    containmentState: containment.containmentState,
    recommendedAction: containment.recommendedAction,
    isolatedDomains: containment.isolatedDomains,
    quarantinedDomains: containment.quarantinedDomains,
    timestamp: new Date(input.nowMs).toISOString(),
  });

  return {
    assessment,
    containment,
    degradation,
    emergencyStabilization,
    escalation,
    protocols,
    coordination,
    containmentAudit,
    blockedReasons,
  };
}
