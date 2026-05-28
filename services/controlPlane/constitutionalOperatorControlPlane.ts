import type { TenantContext } from "../tenancy/tenantTypes";
import { buildRecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationReadModel";
import { buildStewardshipDashboardModel } from "../stewardship/stewardshipDashboardModel";
import { evaluateConstitutionalGovernance } from "../governance/constitutionalGovernanceEngine";
import { runConstitutionalOperationsOrchestrator } from "../orchestration/constitutionalOperationsOrchestrator";
import { evaluateStrategicContinuity } from "../continuity/strategicContinuityEngine";
import { runAutonomousCoordinationFramework } from "../autonomy/autonomousCoordinationFramework";
import { evaluateOperationalSovereignty } from "../sovereignty/operationalSovereigntyEngine";
import { evaluateAutonomousSupervision } from "../autonomy/autonomousSupervision";
import { runConstitutionalEnforcementRuntime } from "../enforcement/constitutionalEnforcementRuntime";
import { buildOperatorReviewQueue } from "./operatorReviewQueue";
import { buildOperatorApprovalPacket } from "./operatorApprovalWorkflow";
import { buildEvidenceReviewBundle } from "../review/evidenceReviewService";
import { buildReplayMismatchReview } from "../review/replayMismatchReview";
import { buildDisputeReview } from "../review/disputeReviewEngine";
import { buildCoordinationFreezeReview } from "../review/coordinationFreezeReview";
import { buildConstitutionalSimulation } from "../simulation/constitutionalSimulationEngine";
import { buildOperatorGovernancePolicies } from "../governance/operatorGovernancePolicies";
import { evaluateControlPlaneGovernance } from "../governance/controlPlaneGovernance";
import { buildReviewEscalation } from "../governance/reviewEscalation";
import { buildConstitutionalReviewRoute } from "../governance/constitutionalReviewRouting";
import { runConstitutionalSurvivabilityFramework } from "../survivability/constitutionalSurvivabilityFramework";

export async function buildConstitutionalOperatorControlPlane(input: {
  tenantContext: TenantContext;
  nowMs?: number;
}) {
  const nowMs = input.nowMs ?? Date.now();
  const timestamp = new Date(nowMs).toISOString();

  const dashboard = await buildRecoveryDashboardReadModel({ tenantContext: input.tenantContext });
  const stewardship = await buildStewardshipDashboardModel({ tenantContext: input.tenantContext });

  const validation = {
    valid: !stewardship.stale,
    freezeActivated: Boolean(stewardship.view.resilience.requiresFreeze),
    containmentActivated: Boolean(stewardship.view.resilience.requiresContainment),
    blockedReasons: [
      ...(stewardship.stale ? ["CONTROL_PLANE_CONTEXT_MISSING"] : []),
      ...(dashboard.governanceDisputes.length ? ["REPLAY_MISMATCH_UNRESOLVED"] : []),
    ],
  };

  const governance = evaluateConstitutionalGovernance({
    constitutionalAction: stewardship.decision.constitutionalAction,
    constitutionalViolations: stewardship.decision.constitutionalViolations,
    validation,
    readiness: stewardship.readiness,
    operatorApprovalVerified: stewardship.readiness.requiresOperatorApproval,
  });
  const orchestration = runConstitutionalOperationsOrchestrator({
    requestType: "governance.operator.review",
    constitutionalAction: stewardship.decision.constitutionalAction,
    constitutionalViolations: stewardship.decision.constitutionalViolations,
    validation,
    readiness: stewardship.readiness,
    escalationCoordination: dashboard.escalationCoordination ?? undefined,
    timestamp,
  });
  const continuity = evaluateStrategicContinuity({
    governance,
    orchestration,
    validation,
    readiness: stewardship.readiness,
    simulationForecast: stewardship.forecasting,
    timestamp,
  });
  const coordination = runAutonomousCoordinationFramework({
    strategicContinuity: continuity,
    governance,
    orchestration,
    validation,
    timestamp,
  });
  const sovereignty = evaluateOperationalSovereignty({
    governanceConfidence: governance.governanceConfidence,
    survivabilityConfidence: continuity.survivabilityScore,
    escalationPressure: continuity.escalationPressure,
    activeContainment: governance.containmentRequired || stewardship.view.resilience.requiresContainment,
    failedContainmentAttempts: dashboard.continuityConvergence?.requiresContainment ? 1 : 0,
    unresolvedInstability: dashboard.degradedSystems.length,
    repeatedRecoveryLoops: dashboard.replayDivergenceCount,
    containmentWeakness: stewardship.view.resilience.requiresContainment ? 0.6 : 0.2,
    runawayAutonomySignals: coordination.coordinationRisk > 0.75 ? 1 : 0,
    governanceFailures: dashboard.governanceDisputes.length,
    crossDomainInstability: dashboard.degradedSystems.length,
    constitutionalDegradation: stewardship.view.resilience.constitutionalIntegrityScore < 0.5 ? 0.8 : 0.2,
    approvalAvailability: dashboard.pendingApprovals.length > 0 ? 0.4 : 0.8,
    auditConsistency: dashboard.auditHistory.length > 0 ? 0.85 : 0.35,
    constitutionalValidationHealth: validation.valid ? 0.8 : 0.3,
    enforcementCoverage: stewardship.decision.constitutionalViolations.length > 0 ? 0.7 : 0.85,
    disputedTruthPresent: dashboard.governanceDisputes.length > 0,
  });
  const supervision = evaluateAutonomousSupervision({
    governanceAllowed: governance.allowed,
    approvalVerified: stewardship.readiness.requiresOperatorApproval,
    operatorOverrideAttempted: false,
    actionCategory: "operator_review",
    immutableEvidenceMutationAttempted: false,
    unboundedAutonomyRequested: false,
    emergencyContainmentActive: sovereignty.sovereigntyState === "EMERGENCY_CONTAINMENT",
    sovereigntyState: sovereignty.sovereigntyState,
    coordinationRisk: coordination.coordinationRisk,
    escalationRequired: coordination.escalationRequired,
    disputedTruthPresent: dashboard.governanceDisputes.length > 0,
    timestamp,
  });
  const enforcement = runConstitutionalEnforcementRuntime({
    governance,
    sovereignty,
    continuity,
    coordination,
    supervision,
    validation,
    escalationLineagePresent: Boolean(dashboard.escalationCoordination?.escalationLineageId),
    immutableAuditAvailable: dashboard.auditHistory.length > 0,
    timestamp,
  });

  const reviewQueue = buildOperatorReviewQueue({ dashboard, nowMs });
  const approvalPackets = reviewQueue.map((review) => buildOperatorApprovalPacket(review));
  const evidenceReview = buildEvidenceReviewBundle({ dashboard });
  const replayReview = buildReplayMismatchReview({ tenantContext: input.tenantContext, dashboard });
  const disputeReview = buildDisputeReview({ dashboard });
  const coordinationReview = buildCoordinationFreezeReview({ dashboard });
  const simulation = buildConstitutionalSimulation({ dashboard, nowMs });
  const governancePolicies = buildOperatorGovernancePolicies({ dashboard });
  const controlPlaneGovernance = evaluateControlPlaneGovernance({ dashboard, reviewType: "operator_control_plane" });
  const reviewEscalation = buildReviewEscalation({ dashboard, reviewType: "operator_control_plane" });
  const reviewRoute = buildConstitutionalReviewRoute({
    reviewType: "operator_control_plane",
    blockedReasons: controlPlaneGovernance.blockedReasons,
  });
  const survivability = runConstitutionalSurvivabilityFramework({
    governance,
    sovereignty,
    continuity,
    enforcement,
    coordination,
    supervision,
    replayReview,
    disputeReview,
    auditHistoryLength: dashboard.auditHistory.length,
    degradedSystems: dashboard.degradedSystems,
    nowMs,
  });

  return {
    dashboard,
    stewardship,
    governance,
    orchestration,
    continuity,
    coordination,
    sovereignty,
    supervision,
    enforcement,
    reviewQueue,
    approvalPackets,
    evidenceReview,
    replayReview,
    disputeReview,
    coordinationReview,
    simulation,
    survivability,
    governancePolicies,
    controlPlaneGovernance,
    reviewEscalation,
    reviewRoute,
  };
}
