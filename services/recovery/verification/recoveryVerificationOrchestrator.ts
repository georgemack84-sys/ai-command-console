import { appendGovernedRecoveryVerificationAudit } from "./recoveryVerificationAudit";
import { aggregateRecoveryDivergence } from "./recoveryDivergenceAggregator";
import { certifyRecoveryTruth } from "./recoveryCertificationEngine";
import { reconcileRecoveryTruthState } from "./recoveryTruthReconciliation";
import { collectStoredRecoveryVerificationEvidence } from "./recoveryVerificationEvidence";
import { RECOVERY_VERIFICATION_ORCHESTRATOR_ERRORS } from "./recoveryVerificationErrors";
import type { RecoverySimulationResult } from "../simulation/recoverySimulationTypes";
import type { TenantContext } from "../../tenancy/tenantTypes";
import type { SecurityContext } from "../../security/securityTypes";
import type { RecoveryVerificationEvidenceBundle, RecoveryVerificationResult } from "./recoveryVerificationTypes";
import { recordVerificationMetric } from "../../recoveryVerification/verificationMetrics";

export async function orchestrateRecoveryVerification({
  executionId,
  tenantContext,
  securityContext,
  evidence,
  appendAudit = true,
  nowMs = Date.now(),
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  evidence?: RecoveryVerificationEvidenceBundle;
  appendAudit?: boolean;
  nowMs?: number;
}): Promise<RecoveryVerificationResult> {
  void securityContext;
  const timestamp = new Date(nowMs).toISOString();
  const collected = evidence || collectStoredRecoveryVerificationEvidence({ executionId, tenantContext });

  if (appendAudit) {
    appendGovernedRecoveryVerificationAudit({
      type: "recovery.verification.started",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
    });
  }

  const missingEvidence: string[] = [];
  if (!collected.replayVerification) missingEvidence.push(RECOVERY_VERIFICATION_ORCHESTRATOR_ERRORS.RECOVERY_VERIFICATION_EVIDENCE_MISSING);
  if (!collected.simulationResult) missingEvidence.push(RECOVERY_VERIFICATION_ORCHESTRATOR_ERRORS.RECOVERY_SIMULATION_EVIDENCE_MISSING);
  if (!collected.continuityState) missingEvidence.push(RECOVERY_VERIFICATION_ORCHESTRATOR_ERRORS.RECOVERY_TRUTH_UNVERIFIABLE);

  const divergenceSummary = aggregateRecoveryDivergence({
    replayDisputes: (collected.replayVerification?.disputes as string[] | undefined) || [],
    simulationDisputes: (collected.simulationResult?.disputes as string[] | undefined) || [],
    continuityDisputes: collected.continuityState?.replayDivergenceDetected ? ["CONTINUITY_REPLAY_DIVERGENCE"] : [],
    governanceDisputes: collected.governanceDenied ? [RECOVERY_VERIFICATION_ORCHESTRATOR_ERRORS.RECOVERY_GOVERNANCE_CONFLICT] : [],
  });

  const reconciliation = reconcileRecoveryTruthState({
    executionId,
    replayVerification: collected.replayVerification,
    simulation: collected.simulationResult,
    continuityState: collected.continuityState,
    immutableEvidenceValid: collected.immutableEvidenceValid,
    divergenceSummary,
    timestamp,
  });

  const certification = certifyRecoveryTruth({
    reconciliationState: reconciliation.reconciliationState,
    replayConsistent: reconciliation.replayConsistent,
    governanceConsistent: reconciliation.governanceConsistent,
    continuityConsistent: reconciliation.continuityConsistent,
    immutableEvidenceValid: reconciliation.immutableEvidenceValid,
    disputed: reconciliation.disputed,
    divergenceDetected: reconciliation.divergenceDetected,
    warnings: [
      ...((collected.simulationResult?.warnings as string[] | undefined) || []),
      ...(collected.continuityState?.degradation?.evidence as string[] | undefined || []),
    ],
  });

  const status: RecoveryVerificationResult["status"] =
    missingEvidence.length > 0 ? "UNVERIFIABLE"
      : reconciliation.divergenceDetected ? "DIVERGED"
        : reconciliation.disputed ? "DISPUTED"
          : certification.decision === "CERTIFIED_WITH_WARNINGS" ? "PARTIALLY_VERIFIED"
            : certification.decision === "CERTIFIED" ? "VERIFIED"
              : "FAILED";

  const result: RecoveryVerificationResult = {
    verificationId: `recovery_verification_${executionId}_${nowMs}`,
    executionId,
    status,
    reconciliationState: reconciliation.reconciliationState,
    certificationDecision: certification.decision,
    verified: status === "VERIFIED" || status === "PARTIALLY_VERIFIED",
    disputed: reconciliation.disputed,
    divergenceDetected: reconciliation.divergenceDetected,
    requiresOperatorReview: certification.requiresOperatorReview,
    evidence: Array.from(new Set([
      ...((collected.replayVerification?.evidence as string[] | undefined) || []),
      ...((collected.simulationResult?.evidenceIds as string[] | undefined) || []),
      ...(collected.auditEvents?.map((event: Record<string, unknown>) => String(event.id || "")) || []),
    ])).filter(Boolean),
    errors: missingEvidence,
    warnings: Array.from(new Set([
      ...((collected.simulationResult?.warnings as string[] | undefined) || []),
      ...(reconciliation.mismatches || []),
    ])),
    timestamp,
  };

  recordVerificationMetric("verification_duration_ms", tenantContext.tenantId, 1);
  if (reconciliation.disputed) {
    recordVerificationMetric("disputed_recovery_count", tenantContext.tenantId, 1);
  }
  if (status === "UNVERIFIABLE") {
    recordVerificationMetric("unverifiable_recovery_count", tenantContext.tenantId, 1);
  }
  if (certification.decision === "QUARANTINED") {
    recordVerificationMetric("quarantined_recovery_count", tenantContext.tenantId, 1);
  }

  if (appendAudit) {
    const auditType =
      status === "VERIFIED" || status === "PARTIALLY_VERIFIED"
        ? "recovery.verification.completed"
        : "recovery.verification.failed";
    appendGovernedRecoveryVerificationAudit({
      type: auditType,
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: result,
    });
    appendGovernedRecoveryVerificationAudit({
      type:
        reconciliation.reconciliationState === "RECONCILED" || reconciliation.reconciliationState === "PARTIALLY_RECONCILED"
          ? "recovery.truth.reconciled"
          : reconciliation.reconciliationState === "DIVERGED"
            ? "recovery.truth.diverged"
            : "recovery.truth.disputed",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: reconciliation,
    });
    appendGovernedRecoveryVerificationAudit({
      type:
        certification.decision === "CERTIFIED" || certification.decision === "CERTIFIED_WITH_WARNINGS"
          ? "recovery.certification.approved"
          : certification.decision === "QUARANTINED"
            ? "recovery.certification.quarantined"
            : "recovery.certification.rejected",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: certification,
    });
  }

  return result;
}
