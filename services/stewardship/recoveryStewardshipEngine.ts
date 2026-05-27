// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../auditTrail.js");

import { orchestrateRecoveryVerification } from "../recovery/verification/recoveryVerificationOrchestrator";
import { collectStoredRecoveryVerificationEvidence, listStoredSimulationSummaries } from "../recovery/verification/recoveryVerificationEvidence";
import type {
  RecoveryDashboardReadModel,
  RecoveryVerificationResult,
  StoredSimulationSummary,
} from "../recovery/verification/recoveryVerificationTypes";
import type { RecoverySimulationResult } from "../recovery/simulation/recoverySimulationTypes";
import type { RuntimeContinuityState } from "../runtime/runtimeContinuityTypes";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { SecurityContext } from "../security/securityTypes";
import { coordinateStewardshipEvaluation, type StewardshipEvaluationResult } from "./stewardshipCoordinator";
import { validateStewardshipPolicy } from "./stewardshipPolicyValidator";
import { superviseRecoveryStabilization } from "./recoveryStabilizationSupervisor";
import { evaluateRecoveryContainment } from "./recoveryContainmentEngine";
import { evaluateStewardshipEscalation } from "./stewardshipEscalationManager";
import { forecastRecoverySurvivability } from "./recoverySurvivabilityForecaster";
import { appendStewardshipAuditEvent } from "./stewardshipAudit";
import type { StewardshipState } from "./stewardshipStates";

export type RecoveryStewardshipSummary = StewardshipEvaluationResult & {
  collapseRisk: "low" | "moderate" | "high" | "critical";
};

function countMatching(events: Array<Record<string, unknown>>, pattern: string) {
  return events.filter((event) => String(event.type || "").includes(pattern)).length;
}

function detectCompetingRecoveries({
  executionId,
  dashboard,
  auditEvents,
}: {
  executionId: string;
  dashboard?: RecoveryDashboardReadModel | null;
  auditEvents: Array<Record<string, unknown>>;
}) {
  const activeWorkspaceRecoveries = dashboard?.activeRecoveries.length ?? 0;
  const executionSpecificRecoveryEvents = auditEvents.filter((event) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return String(payload.executionId || "") === executionId
      && (String(event.type || "").includes("recovery.") || String(event.type || "").includes("stewardship."));
  });
  return activeWorkspaceRecoveries > 1 || executionSpecificRecoveryEvents.length > 6;
}

export async function evaluateRecoveryStewardship({
  executionId,
  tenantContext,
  securityContext,
  previousState,
  verification,
  continuityState,
  simulationResult,
  dashboard,
  appendAudit = true,
  nowMs = Date.now(),
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  previousState?: StewardshipState;
  verification?: RecoveryVerificationResult;
  continuityState?: (RuntimeContinuityState & { degradation?: { status?: string; evidence?: string[] } }) | null;
  simulationResult?: RecoverySimulationResult | StoredSimulationSummary | null;
  dashboard?: RecoveryDashboardReadModel | null;
  appendAudit?: boolean;
  nowMs?: number;
}): Promise<RecoveryStewardshipSummary> {
  const storedEvidence = collectStoredRecoveryVerificationEvidence({ executionId, tenantContext });
  const verificationResult = verification || await orchestrateRecoveryVerification({
    executionId,
    tenantContext,
    securityContext,
    evidence: storedEvidence,
    appendAudit: false,
    nowMs,
  });
  const simulation = simulationResult || storedEvidence.simulationResult || listStoredSimulationSummaries({ tenantContext, executionId })[0] || null;
  const runtimeContinuity = continuityState || storedEvidence.continuityState;
  const auditEvents = listAuditEvents(5000).filter((event: Record<string, unknown>) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return payload.tenantId === tenantContext.tenantId
      && payload.workspaceId === tenantContext.workspaceId
      && String(payload.executionId || "") === executionId;
  });

  const competingRecoveries = detectCompetingRecoveries({ executionId, dashboard, auditEvents });
  const policy = validateStewardshipPolicy({
    verification: verificationResult,
    conflictingRecoveries: competingRecoveries,
    approvalPending: Boolean(
      dashboard?.pendingApprovals.some((entry) => String(entry.executionId || "") === executionId)
      || verificationResult.requiresOperatorReview,
    ),
    ambiguousRecoveryState: !runtimeContinuity,
  });
  const stabilization = superviseRecoveryStabilization({
    continuityState: runtimeContinuity,
    verification: verificationResult,
    simulation,
    activeRecoveryCount: dashboard?.activeRecoveries.length || 0,
    blockedEventCount: countMatching(auditEvents, "blocked"),
    quarantineEventCount: countMatching(auditEvents, "quarant"),
  });
  const survivability = forecastRecoverySurvivability({
    continuityConfidence: runtimeContinuity?.continuityConfidence || 0,
    replayDivergence: verificationResult.divergenceDetected,
    simulationOutcome: simulation?.outcome || null,
    certificationDecision: verificationResult.certificationDecision,
    governanceBlocked: policy.governanceBlocked,
    stabilizationStatus: stabilization.status,
    verification: verificationResult,
  });
  const containment = evaluateRecoveryContainment({
    verification: verificationResult,
    stabilization,
    conflictingRecoveries: competingRecoveries,
    survivabilityScore: survivability.survivabilityScore,
  });
  const escalation = evaluateStewardshipEscalation({
    verification: verificationResult,
    stabilization,
    containment,
    governanceBlocked: policy.governanceBlocked,
    recentCertificationFailures: auditEvents.filter((event: Record<string, unknown>) =>
      String(event.type || "") === "recovery.certification.rejected"
      || String(event.type || "") === "recovery.certification.quarantined").length,
  });

  const coordinated = coordinateStewardshipEvaluation({
    previousState,
    verification: verificationResult,
    policy,
    stabilization,
    containment,
    escalation,
    survivability,
  });

  let auditAppended = false;
  if (appendAudit) {
    auditAppended = true;
    appendStewardshipAuditEvent({
      type: "stewardship.evaluated",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: coordinated,
    });
    appendStewardshipAuditEvent({
      type: "stewardship.survivability.forecasted",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: survivability,
    });
    appendStewardshipAuditEvent({
      type:
        coordinated.state === "VERIFIED" ? "stewardship.verified"
          : coordinated.state === "DISPUTED" ? "stewardship.disputed"
            : coordinated.shouldContain ? "stewardship.recovery.contained"
              : coordinated.shouldFreeze ? "stewardship.recovery.frozen"
                : coordinated.shouldEscalate ? "stewardship.escalated"
                  : "stewardship.state.changed",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: coordinated,
    });
    if (policy.reasons.length > 0) {
      appendStewardshipAuditEvent({
        type: "stewardship.policy.denied",
        executionId,
        tenantId: tenantContext.tenantId,
        workspaceId: tenantContext.workspaceId,
        payload: policy,
      });
    }
  }

  return {
    ...coordinated,
    auditAppended,
    collapseRisk: survivability.collapseRisk,
  };
}
