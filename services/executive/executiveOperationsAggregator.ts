import type { TenantContext } from "../tenancy/tenantTypes";
import { buildConstitutionalOperatorControlPlane } from "../controlPlane/constitutionalOperatorControlPlane";
import { buildGovernancePressureMatrix, type GovernancePressureMatrix } from "./governancePressureAnalysis";
import { buildStrategicContinuityForecast, type StrategicForecast } from "./strategicContinuityForecast";
import { buildExecutiveEscalationAnalysis } from "./executiveEscalationAnalysis";
import { buildExecutiveDashboardAuditRecord } from "./executiveAudit";
import { evaluateExecutiveConstraints } from "./executiveConstraints";

export type OperationalSurvivabilityCard = {
  survivabilityState: string;
  continuityConfidence: number;
  collapseProbability: number;
  stabilizationConfidence: number;
  degradationVelocity: number;
  strategicThreatLevel: number;
  emergencyControlsActive: boolean;
};

export async function buildExecutiveOperationsAggregator(input: {
  tenantContext: TenantContext;
  operatorId: string;
  nowMs?: number;
}) {
  const nowMs = input.nowMs ?? Date.now();
  const controlPlane = await buildConstitutionalOperatorControlPlane({
    tenantContext: input.tenantContext,
    nowMs,
  });

  const governancePressure: GovernancePressureMatrix = buildGovernancePressureMatrix({
    governanceIntegrity: controlPlane.sovereignty.governanceIntegrity,
    escalationPressure: controlPlane.sovereignty.escalationPressure,
    pendingApprovals: controlPlane.dashboard.pendingApprovals.length,
    containmentRequired: controlPlane.survivability.containment.containmentRequired,
    survivabilityState: controlPlane.survivability.assessment.survivabilityState,
    autonomyBlockedActions: controlPlane.coordination.deniedActions.length,
    operationalRisk: controlPlane.supervision.operationalRisk,
    constitutionalState: controlPlane.governance.constitutionalState,
  });

  const survivabilityCard: OperationalSurvivabilityCard = {
    survivabilityState: controlPlane.survivability.assessment.survivabilityState,
    continuityConfidence: controlPlane.continuity.survivabilityScore,
    collapseProbability: Math.max(controlPlane.continuity.collapseRisk, 1 - controlPlane.survivability.assessment.recoverabilityConfidence),
    stabilizationConfidence: controlPlane.survivability.assessment.recoverabilityConfidence,
    degradationVelocity: controlPlane.survivability.assessment.systemicInstability,
    strategicThreatLevel: Math.max(controlPlane.sovereignty.systemicRisk, controlPlane.coordination.coordinationRisk),
    emergencyControlsActive: controlPlane.survivability.emergencyStabilization.required,
  };

  const strategicForecast: StrategicForecast = buildStrategicContinuityForecast({
    survivabilityScore: controlPlane.continuity.survivabilityScore,
    recoverabilityConfidence: controlPlane.survivability.assessment.recoverabilityConfidence,
    systemicInstability: controlPlane.survivability.assessment.systemicInstability,
    collapseRisk: controlPlane.continuity.collapseRisk,
    containmentRequired: controlPlane.survivability.containment.containmentRequired,
    governanceConfidence: controlPlane.governance.governanceConfidence,
    disputeCount: controlPlane.disputeReview.unresolvedDisputes.length + controlPlane.replayReview.divergenceCount,
    nowMs,
  });

  const escalation = buildExecutiveEscalationAnalysis({
    escalationChain: controlPlane.reviewEscalation.escalationChain,
    escalationRequired: controlPlane.reviewEscalation.escalationRequired,
    blockedReasons: controlPlane.survivability.blockedReasons,
    supervisionState: controlPlane.supervision.supervisionState,
    escalationPressure: controlPlane.sovereignty.escalationPressure,
    governanceViolations: controlPlane.governance.violations,
  });

  const constraints = evaluateExecutiveConstraints({
    deterministicSimulation: controlPlane.simulation.deterministic,
    disputedTruthPresent: controlPlane.disputeReview.unresolvedDisputes.length > 0,
    containmentRequired: controlPlane.survivability.containment.containmentRequired,
    emergencyLockActive: controlPlane.enforcement.emergencyLockActive,
    blockedReasons: controlPlane.survivability.blockedReasons,
  });

  const audit = buildExecutiveDashboardAuditRecord({
    operatorId: input.operatorId,
    viewedPanels: [
      "constitutional-operations",
      "strategic-continuity",
      "autonomous-supervision",
      "containment",
      "survivability-forecast",
    ],
    survivabilityState: controlPlane.survivability.assessment.survivabilityState,
    governanceSafe: constraints.governanceSafe,
    containmentState: controlPlane.survivability.containment.containmentState,
    createdAt: nowMs,
  });

  return {
    controlPlane,
    governancePressure,
    survivabilityCard,
    strategicForecast,
    escalation,
    constraints,
    audit,
  };
}
