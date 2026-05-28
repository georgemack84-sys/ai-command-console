import type { TenantContext } from "../tenancy/tenantTypes";
import { buildRecoveryViolationAudit } from "../constitutional/recoveryViolationAudit";
import { buildRecoveryDecisionAudit } from "../decision/recoveryDecisionAudit";
import { buildRecoveryDecisionIntelligence } from "../decision/recoveryDecisionIntelligence";
import { buildReadinessAuditRecord } from "../readiness/readinessAudit";
import { evaluateAutonomousRecoveryReadiness } from "../readiness/autonomousRecoveryReadiness";
import { buildRecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationReadModel";
import { buildRecoveryForecasting } from "../simulation/recoveryForecasting";
import { buildStewardshipDashboardAudit } from "./stewardshipDashboardAudit";
import { applyStewardshipDashboardPolicies, isDashboardStateStale } from "./stewardshipDashboardPolicies";
import { buildSupervisoryControlView } from "./supervisoryControlView";

export async function buildStewardshipDashboardModel({
  tenantContext,
  nowMs = Date.now(),
}: {
  tenantContext: TenantContext;
  nowMs?: number;
}) {
  const dashboard = await buildRecoveryDashboardReadModel({ tenantContext, nowMs });
  const { view, resilience } = buildSupervisoryControlView(dashboard);
  const forecasting = buildRecoveryForecasting({ dashboard, supervisoryView: view, nowMs });
  const decisionExecutionId = dashboard.recoveryPrioritization?.recoveryQueue[0]
    || String(dashboard.activeRecoveries[0]?.executionId || dashboard.blockedRecoveries[0]?.executionId || "workspace");
  const decision = buildRecoveryDecisionIntelligence({
    executionId: decisionExecutionId,
    evidence: {
      dashboard,
      forecasting: { summary: forecasting.summary },
    },
    generatedAt: dashboard.generatedAt,
  });
  const readiness = evaluateAutonomousRecoveryReadiness({
    constitutionalEnforcement: {
      constitutionalAction: decision.constitutionalAction,
      constitutionallyAllowed: decision.constitutionallyAllowed,
      constitutionalViolations: decision.constitutionalViolations,
    },
    decisionIntelligence: decision,
    simulationForecast: forecasting.summary,
    simulationLineage: forecasting.summary.simulations.flatMap((simulation) => simulation.forecastLineage),
    convergence: dashboard.continuityConvergence,
    stability: {
      confidence: dashboard.operationalStabilityAssessment?.confidence,
      disputed: dashboard.operationalStabilityAssessment?.disputed,
      stabilizationRequired: dashboard.operationalStabilityAssessment?.stabilizationRequired,
    },
    escalation: dashboard.escalationCoordination,
    containment: {
      confidence: dashboard.continuityConvergence?.requiresContainment
        ? Math.max(0.2, 1 - (forecasting.summary.containmentPressure || 0.7))
        : Math.max(0.3, 1 - (forecasting.summary.containmentPressure || 0.4)),
      requiresContainment: dashboard.continuityConvergence?.requiresContainment || dashboard.operationalStabilityAssessment?.containmentRecommended,
    },
    rollback: {
      guaranteed: forecasting.summary.simulations.some((simulation) => simulation.simulationType === "ROLLBACK"),
      confidence: forecasting.summary.simulations.find((simulation) => simulation.simulationType === "ROLLBACK")?.confidenceScore ?? 0.2,
    },
    auditEvidence: dashboard.auditHistory,
    timestamp: dashboard.generatedAt,
  });
  const stale = isDashboardStateStale({ generatedAt: view.generatedAt, nowMs });
  const governed = applyStewardshipDashboardPolicies({ view, resilience: resilience.assessment, stale });

  return {
    view: governed.view,
    stale,
    controlsHidden: governed.controlsHidden,
    sourceDashboard: dashboard,
    forecasting: forecasting.summary,
    simulationAudit: forecasting.auditRecords,
    auditReady: buildStewardshipDashboardAudit(governed.view),
    resilienceAudit: resilience.auditRecord,
    resilienceTelemetry: resilience.telemetry,
    decision,
    readiness,
    constitutionalAudit: buildRecoveryViolationAudit({
      executionId: decision.executionId,
      constitutionalAction: decision.constitutionalAction,
      reasons: decision.reasons,
      violations: decision.constitutionalViolations,
      evidence: decision.forecastLineageIds,
      generatedAt: decision.generatedAt,
    }),
    decisionAudit: buildRecoveryDecisionAudit(decision),
    readinessAudit: buildReadinessAuditRecord({
      readinessState: readiness.readinessState,
      readinessScore: readiness.readinessScore,
      blockedReasons: readiness.autonomyBlockedReasons,
      evidenceRefs: dashboard.auditHistory.map((entry) => String(entry.id || "")).filter(Boolean).slice(0, 6),
      timestamp: readiness.timestamp,
    }),
  };
}
