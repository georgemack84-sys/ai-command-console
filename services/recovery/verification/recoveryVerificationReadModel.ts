// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../../auditTrail.js");

import { buildRecoveryReadModel } from "../recoveryReadModel";
import type { TenantContext } from "../../tenancy/tenantTypes";
import { collectStoredRecoveryVerificationEvidence, listStoredSimulationSummaries } from "./recoveryVerificationEvidence";
import { orchestrateRecoveryVerification } from "./recoveryVerificationOrchestrator";
import type { RecoveryDashboardReadModel } from "./recoveryVerificationTypes";
import { evaluateRecoveryStewardship } from "../../stewardship/recoveryStewardshipEngine";
import { assessOperationalStability } from "../../stability/operationalStabilityEngine";
import { coordinateEscalation } from "../../escalation/escalationCoordinator";
import { evaluateContinuityConvergence } from "../../convergence/continuityConvergenceEngine";
import { prioritizeRecoveries } from "../../prioritization/recoveryPrioritization";

function uniqueExecutionIds(events: Array<Record<string, unknown>>) {
  return Array.from(new Set(events.map((event) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return String(payload.executionId || "").trim();
  }).filter(Boolean)));
}

export async function buildRecoveryDashboardReadModel({
  tenantContext,
  nowMs = Date.now(),
}: {
  tenantContext: TenantContext;
  nowMs?: number;
}): Promise<RecoveryDashboardReadModel> {
  const auditHistory: Array<Record<string, unknown>> = listAuditEvents(200)
    .filter((event: Record<string, unknown>) => {
      const payload = (event.payload || {}) as Record<string, unknown>;
      return payload.tenantId === tenantContext.tenantId && payload.workspaceId === tenantContext.workspaceId;
    });
  const executionIds = uniqueExecutionIds(auditHistory).slice(0, 12);
  const readModels = await Promise.all(executionIds.map(async (executionId) => ({
    executionId,
    readModel: await buildRecoveryReadModel({ executionId, nowMs, tenantContext }),
  })));
  const verificationSummaries = await Promise.all(executionIds.map(async (executionId) => orchestrateRecoveryVerification({
    executionId,
    tenantContext,
    evidence: collectStoredRecoveryVerificationEvidence({ executionId, tenantContext }),
    appendAudit: false,
  })));
  const simulationOutcomes = listStoredSimulationSummaries({ tenantContext });

  const runtimeContinuity = collectStoredRecoveryVerificationEvidence({
    executionId: executionIds[0] || "unknown",
    tenantContext,
  }).continuityState;

  const activeRecoveries = readModels
    .filter((entry) => entry.readModel.ok && ["pending", "in_progress"].includes(entry.readModel.data.recovery.status))
    .map((entry) => ({
      executionId: entry.executionId,
      status: entry.readModel.ok ? entry.readModel.data.recovery.status : "unknown",
    }));
  const pendingApprovals = readModels
    .filter((entry) => entry.readModel.ok && entry.readModel.data.recoveryControl.requiresApproval)
    .map((entry) => ({
      executionId: entry.executionId,
      status: entry.readModel.ok ? entry.readModel.data.recoveryControl.status : "unknown",
    }));
  const blockedRecoveries = verificationSummaries
    .filter((entry) => ["REQUIRES_OPERATOR_REVIEW", "REJECTED", "ESCALATED"].includes(entry.certificationDecision))
    .map((entry) => ({
      executionId: entry.executionId,
      certificationDecision: entry.certificationDecision,
      status: entry.status,
    }));
  const quarantinedExecutions = verificationSummaries
    .filter((entry) => entry.certificationDecision === "QUARANTINED")
    .map((entry) => ({
      executionId: entry.executionId,
      certificationDecision: entry.certificationDecision,
      status: entry.status,
    }));
  const governanceDisputes = verificationSummaries
    .filter((entry) => entry.disputed || entry.certificationDecision === "REQUIRES_OPERATOR_REVIEW")
    .map((entry) => ({
      executionId: entry.executionId,
      disputes: entry.errors.length > 0 ? entry.errors : entry.warnings,
    }));
  const leaseConflicts = readModels
    .filter((entry) => entry.readModel.ok && entry.readModel.data.lock.stale)
    .map((entry) => ({
      executionId: entry.executionId,
      stale: true,
      ownerId: entry.readModel.ok ? entry.readModel.data.lock.ownerId : null,
    }));

  const latestVerification = verificationSummaries[0] || null;
  const baseModel: RecoveryDashboardReadModel = {
    runtimeContinuityState: runtimeContinuity?.runtimeState || "UNVERIFIABLE",
    continuityConfidence: runtimeContinuity?.continuityConfidence || 0,
    operationalStability: runtimeContinuity?.degradation?.status ? String(runtimeContinuity.degradation.status) : "unknown",
    degradedSystems: runtimeContinuity?.degradedDependencies || [],
    activeRecoveries,
    pendingApprovals,
    blockedRecoveries,
    quarantinedExecutions,
    replayVerificationState: latestVerification?.status || "UNVERIFIABLE",
    replayDivergenceCount: verificationSummaries.filter((entry) => entry.divergenceDetected).length,
    leaseConflicts,
    auditHistory: auditHistory.slice(0, 25),
    governanceDisputes,
    certificationState: latestVerification?.certificationDecision || "REJECTED",
    simulationOutcomes,
    continuityRiskScore: Math.max(0, 100 - Math.round((runtimeContinuity?.survivabilityScore || 0) * 100)),
    stewardship: null,
    operationalStabilityAssessment: null,
    escalationCoordination: null,
    continuityConvergence: null,
    recoveryPrioritization: null,
    generatedAt: new Date(nowMs).toISOString(),
  };

  const stewardshipExecutionId = (
    blockedRecoveries[0]?.executionId
    || quarantinedExecutions[0]?.executionId
    || activeRecoveries[0]?.executionId
    || latestVerification?.executionId
    || executionIds[0]
    || null
  ) as string | null;
  const stewardship = stewardshipExecutionId
    ? await evaluateRecoveryStewardship({
      executionId: stewardshipExecutionId,
      tenantContext,
      verification: verificationSummaries.find((entry) => entry.executionId === stewardshipExecutionId) || undefined,
      continuityState: runtimeContinuity,
      simulationResult: simulationOutcomes.find((entry) => String(entry.executionId || "") === stewardshipExecutionId) || null,
      dashboard: baseModel,
      appendAudit: false,
      nowMs,
    })
    : null;

  const operationalStabilityAssessment = assessOperationalStability({
    stewardshipState: stewardship?.state,
    stewardshipSignals: {
      freezeRequired: stewardship?.shouldFreeze,
      containmentRequired: stewardship?.shouldContain,
      escalationRequired: stewardship?.shouldEscalate,
      disputed: stewardship?.state === "DISPUTED" || stewardship?.verificationBlocked || stewardship?.governanceBlocked,
    },
    survivabilityForecast: {
      collapseRisk:
        stewardship?.collapseRisk === "critical" ? 0.9
          : stewardship?.collapseRisk === "high" ? 0.7
            : stewardship?.collapseRisk === "moderate" ? 0.45
              : 0.15,
      survivabilityScore: stewardship?.survivabilityScore,
      confidence: stewardship?.confidence,
      reasons: stewardship?.reasoning,
    },
    continuity: {
      continuityConfidence: runtimeContinuity?.continuityConfidence,
      staleExecutions: leaseConflicts.length,
      degradedDependencies: runtimeContinuity?.degradedDependencies || [],
      activeRecoveries: activeRecoveries.length,
    },
    replay: {
      divergenceCount: verificationSummaries.filter((entry) => entry.divergenceDetected).length,
      divergenceSeverity: verificationSummaries.some((entry) => entry.status === "DIVERGED") ? 1 : verificationSummaries.some((entry) => entry.disputed) ? 0.6 : 0,
    },
    recovery: {
      activeRecoveries: activeRecoveries.length,
      failedRecoveries: blockedRecoveries.length,
      successfulRecoveries: verificationSummaries.filter((entry) => entry.verified).length,
      repeatedFailures: Math.max(0, blockedRecoveries.length - verificationSummaries.filter((entry) => entry.verified).length),
    },
    escalation: {
      escalationCount: auditHistory.filter((event: Record<string, unknown>) => String(event.type || "").includes("escalat")).length,
      unresolvedEscalations: governanceDisputes.length + quarantinedExecutions.length,
    },
    operator: {
      interventionCount: pendingApprovals.length + governanceDisputes.length,
    },
    timestamp: new Date(nowMs).toISOString(),
  });

  const escalationCoordination = stewardshipExecutionId
    ? coordinateEscalation({
      executionId: stewardshipExecutionId,
      source: "operational.stability",
      requestedType:
        operationalStabilityAssessment.lockdownRecommended ? "emergency"
          : operationalStabilityAssessment.containmentRecommended ? "containment"
            : operationalStabilityAssessment.escalationPressure >= 0.55 ? "governance"
              : operationalStabilityAssessment.recoveryPressure >= 0.55 ? "recovery"
                : operationalStabilityAssessment.dependencyInstabilityScore >= 0.55 ? "infrastructure"
                  : "operator",
      reason: operationalStabilityAssessment.reasons[0] || "operational stability coordination required",
      evidence: Array.from(new Set([
        ...(stewardship?.evidence || []),
        ...auditHistory.slice(0, 5).map((event: Record<string, unknown>) => String(event.id || "")).filter(Boolean),
      ])).slice(0, 6),
      stabilityAssessment: operationalStabilityAssessment,
      existingEscalations: [],
      timestamp: new Date(nowMs).toISOString(),
    })
    : null;

  const continuityConvergence = evaluateContinuityConvergence({
    executionId: stewardshipExecutionId || undefined,
    timestamp: new Date(nowMs).toISOString(),
    continuity: {
      runtimeState: runtimeContinuity?.runtimeState,
      continuityConfidence: runtimeContinuity?.continuityConfidence,
      degradedDependencies: runtimeContinuity?.degradedDependencies || [],
      staleExecutions: leaseConflicts.length,
      replayDivergenceDetected: Boolean(runtimeContinuity?.replayDivergenceDetected),
    },
    verification: latestVerification ? {
      status: latestVerification.status,
      disputed: latestVerification.disputed,
      divergenceDetected: latestVerification.divergenceDetected,
      warnings: latestVerification.warnings,
      errors: latestVerification.errors,
      evidence: latestVerification.evidence,
    } : undefined,
    stewardship,
    stability: operationalStabilityAssessment,
    escalation: escalationCoordination?.state,
    activeRecoveries,
    blockedRecoveries,
    quarantinedExecutions,
    governanceDisputes,
    leaseConflicts,
    auditHistory: auditHistory.slice(0, 25),
  }).result;

  const recoveryPrioritization = prioritizeRecoveries({
    candidates: executionIds.map((executionId) => {
      const verification = verificationSummaries.find((entry) => entry.executionId === executionId);
      const active = activeRecoveries.find((entry) => String(entry.executionId) === executionId);
      const blocked = blockedRecoveries.find((entry) => String(entry.executionId) === executionId);
      const quarantined = quarantinedExecutions.find((entry) => String(entry.executionId) === executionId);

      return {
        executionId,
        tenantId: tenantContext.tenantId,
        createdAt: new Date(nowMs - executionIds.indexOf(executionId) * 1000).toISOString(),
        operationalCriticality: active ? 0.7 : blocked ? 0.6 : 0.45,
        survivabilityImpact: quarantined ? 0.9 : blocked ? 0.75 : active ? 0.65 : 0.4,
        governanceRisk: verification?.requiresOperatorReview ? 0.8 : verification?.disputed ? 0.72 : 0.35,
        replayConfidence: verification?.verified ? 0.9 : verification?.disputed ? 0.35 : verification?.divergenceDetected ? 0.2 : 0.5,
        escalationSeverity:
          escalationCoordination?.state.escalationSeverity === "CATASTROPHIC" ? 1
            : escalationCoordination?.state.escalationSeverity === "CRITICAL" ? 0.85
              : escalationCoordination?.state.escalationSeverity === "HIGH" ? 0.65
                : 0.35,
        dependencyImportance: continuityConvergence.affectedExecutions.includes(executionId) ? 0.7 : 0.45,
        continuityStability: continuityConvergence.affectedExecutions.includes(executionId)
          ? Math.max(0.1, continuityConvergence.continuityConfidence)
          : baseModel.continuityConfidence,
        tenantImpact: blocked ? 0.65 : 0.35,
        recoveryComplexity: verification?.divergenceDetected ? 0.75 : blocked ? 0.55 : 0.35,
        recoveryUrgency: active ? 0.72 : quarantined ? 0.82 : 0.4,
        evidence: Array.from(new Set([
          ...((verification?.evidence || []) as string[]),
          ...auditHistory
            .filter((event: Record<string, unknown>) => {
              const payload = (event.payload || {}) as Record<string, unknown>;
              return String(payload.executionId || "") === executionId;
            })
            .slice(0, 3)
            .map((event: Record<string, unknown>) => String(event.id || ""))
            .filter(Boolean),
        ])),
      };
    }).filter((candidate) => candidate.evidence.length > 0),
    tenantId: tenantContext.tenantId,
    evidence: Array.from(new Set([
      ...continuityConvergence.evidence,
      ...auditHistory.slice(0, 5).map((event: Record<string, unknown>) => String(event.id || "")).filter(Boolean),
    ])).slice(0, 8),
    timestamp: new Date(nowMs).toISOString(),
    convergence: continuityConvergence,
    stability: operationalStabilityAssessment,
    escalation: escalationCoordination?.state || null,
    stewardship,
  });

  return {
    ...baseModel,
    stewardship,
    operationalStabilityAssessment,
    escalationCoordination: escalationCoordination ? {
      escalationId: escalationCoordination.state.escalationId,
      escalationType: escalationCoordination.state.escalationType,
      escalationState: escalationCoordination.state.escalationState,
      escalationSeverity: escalationCoordination.state.escalationSeverity,
      escalationLineageId: escalationCoordination.state.escalationLineageId,
      parentEscalationId: escalationCoordination.state.parentEscalationId,
      conflictingEscalations: escalationCoordination.state.conflictingEscalations,
      requiresContainment: escalationCoordination.state.requiresContainment,
      requiresOperatorVisibility: escalationCoordination.state.requiresOperatorVisibility,
      frozen: escalationCoordination.state.frozen,
      blocked: escalationCoordination.state.blocked,
      blockReason: escalationCoordination.state.blockReason,
      recommendedActions: escalationCoordination.state.recommendedActions,
      confidence: escalationCoordination.state.confidence,
      evidenceCount: escalationCoordination.state.evidence.length,
      reason: escalationCoordination.state.escalationReason,
      source: escalationCoordination.state.escalationSource,
      timestamp: escalationCoordination.state.timestamp,
    } : null,
    continuityConvergence,
    recoveryPrioritization: {
      prioritizationApproved: recoveryPrioritization.prioritizationApproved,
      deterministicOrderingVerified: recoveryPrioritization.deterministicOrderingVerified,
      governanceReviewRequired: recoveryPrioritization.governanceReviewRequired,
      containmentPriorityRequired: recoveryPrioritization.containmentPriorityRequired,
      survivabilityPriorityRequired: recoveryPrioritization.survivabilityPriorityRequired,
      recoveryQueue: recoveryPrioritization.recoveryQueue,
      blockedRecoveries: recoveryPrioritization.blockedRecoveries,
      disputedRecoveries: recoveryPrioritization.disputedRecoveries,
      prioritizationConfidence: recoveryPrioritization.prioritizationConfidence,
      prioritizationReasons: recoveryPrioritization.prioritizationReasons,
      starvationWarnings: recoveryPrioritization.starvationWarnings,
      assessments: recoveryPrioritization.assessments.map((assessment) => ({
        executionId: assessment.executionId,
        prioritizationScore: assessment.prioritizationScore,
        category: assessment.category,
        state: assessment.state,
        deterministicRank: assessment.deterministicRank,
        governanceReviewRequired: assessment.governanceReviewRequired,
        prioritizationReasons: assessment.prioritizationReasons,
        prioritizationWarnings: assessment.prioritizationWarnings,
      })),
      timestamp: recoveryPrioritization.timestamp,
    },
  };
}
