import { authorizeSecurityAction } from "../security/authorizationGuard";
import { classifyFailure } from "../failure/failureClassifier";
import { mapFailureClassificationToRecovery } from "../failure/failureRecoveryMapping";
import { getRuntimeContinuityState } from "../runtime/runtimeContinuityState";
import { RECOVERY_VERIFICATION_ERROR_CODES } from "./recoveryVerificationErrors";
import { collectRecoveryVerificationEvidence } from "./recoveryVerificationEvidence";
import { validateReplayIntegrity } from "./replayIntegrityValidator";
import { validateGovernanceIntegrity } from "./governanceIntegrityValidator";
import { reconcileRuntimeTruth } from "./truthReconciliationEngine";
import { evaluateVerificationDisputes } from "./verificationDisputeEngine";
import { computeVerificationConfidence } from "./verificationConfidenceEngine";
import { decideRecoveryVerificationState } from "./verificationDecisionEngine";
import { appendRecoveryVerificationAuditEvent } from "./recoveryVerificationAudit";
import { recordVerificationMetric } from "./verificationMetrics";
import type { RecoveryVerificationResult } from "./recoveryVerificationTypes";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { SecurityContext } from "../security/securityTypes";

function deriveSignalType(bundle: any) {
  if (bundle?.state === "disputed") {
    return "evidence inconsistency";
  }
  if (String(bundle?.readModel?.verification?.status || "") === "failed") {
    return "verification mismatch";
  }
  if (bundle?.readModel?.lock?.stale) {
    return "lease expiration";
  }
  if (bundle?.readModel?.recoveryControl?.requiresApproval && String(bundle?.readModel?.recoveryControl?.status || "") !== "approved") {
    return "approval expiration";
  }
  return "stale execution";
}

function fail(code: string, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}

export async function runRecoveryVerificationEngine({
  executionId,
  tenantContext,
  securityContext,
  nowMs = Date.now(),
  overrides,
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  nowMs?: number;
  overrides?: Record<string, unknown>;
}): Promise<
  | { ok: true; data: RecoveryVerificationResult }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } }
> {
  if (securityContext) {
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission: "recovery:verify",
      action: "recovery.verify",
      resource: { executionId },
    });
    if (!authorization.ok) {
      return fail(authorization.error.code, authorization.error.message, authorization.error.details);
    }
  }

  const evidence = await collectRecoveryVerificationEvidence({
    executionId,
    tenantContext,
    nowMs,
    overrides,
  });
  if (!evidence.ok) {
    return fail(evidence.error.code, evidence.error.message);
  }

  const continuity = evidence.data.continuityState || getRuntimeContinuityState({
    tenantContext,
    nowMs,
    persistSnapshot: false,
  });
  const classification = await classifyFailure({
    executionId,
    tenantContext,
    signal: { type: deriveSignalType(evidence.data.bundle) },
    sources: {
      readModel: evidence.data.bundle.readModel,
      timeline: evidence.data.bundle.timeline,
      startupStatus: null,
    },
    nowMs,
  });
  if (!classification.ok && !classification.classification) {
    return fail(
      RECOVERY_VERIFICATION_ERROR_CODES.RECOVERY_VERIFICATION_CLASSIFICATION_REQUIRED,
      "Recovery verification requires evidence-backed failure classification.",
      classification.error.details,
    );
  }

  const effectiveClassification = classification.ok ? classification.data : classification.classification!;
  const mapping = mapFailureClassificationToRecovery(effectiveClassification);
  const replayIntegrity = validateReplayIntegrity({
    bundle: evidence.data.bundle,
    ledgerEvents: evidence.data.ledgerEvents,
  });
  const governanceIntegrity = validateGovernanceIntegrity({
    bundle: evidence.data.bundle,
    auditEvents: evidence.data.auditEvents,
  });
  const truth = reconcileRuntimeTruth({
    bundle: evidence.data.bundle,
    executionState: evidence.data.executionState,
    continuityState: (continuity as any)?.ok ? (continuity as any).data : continuity,
  });
  const disputes = evaluateVerificationDisputes({
    replayIntegrity,
    governanceIntegrity,
    continuityState: (continuity as any)?.ok ? (continuity as any).data : continuity,
    reconciliationEvidence: truth.disputes,
  });
  const confidenceScore = computeVerificationConfidence({
    replayIntegrity: replayIntegrity.valid,
    governanceIntegrity: governanceIntegrity.valid,
    truthIntegrity: truth.runtimeIntegrity,
    continuityIntegrity: truth.continuityIntegrity,
    disputeCount: disputes.disputes.length,
  });
  const verificationState = decideRecoveryVerificationState({
    replayIntegrity: replayIntegrity.valid,
    governanceIntegrity: governanceIntegrity.valid,
    runtimeIntegrity: truth.runtimeIntegrity,
    continuityIntegrity: truth.continuityIntegrity,
    disputeCount: disputes.disputes.length,
  });

  const result: RecoveryVerificationResult = {
    verificationId: `verification_${effectiveClassification.classificationId}_${nowMs}`,
    executionId,
    verified: verificationState === "VERIFIED",
    verificationState,
    confidenceScore,
    runtimeIntegrity: truth.runtimeIntegrity,
    replayIntegrity: replayIntegrity.valid,
    governanceIntegrity: governanceIntegrity.valid,
    continuityIntegrity: truth.continuityIntegrity,
    disputes: disputes.disputes.map((dispute) => dispute.code),
    evidence: Array.from(new Set([
      ...effectiveClassification.evidence,
      ...replayIntegrity.evidence,
      ...governanceIntegrity.evidence,
      ...truth.evidence,
    ])).sort((left, right) => left.localeCompare(right)),
    verifiedAt: new Date(nowMs).toISOString(),
    classificationId: effectiveClassification.classificationId,
    classificationCategory: effectiveClassification.category,
    classificationSeverity: effectiveClassification.severity,
  };

  appendRecoveryVerificationAuditEvent({
    type: "recovery.verification.completed",
    executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: result,
  });

  recordVerificationMetric(result.verified ? "verification.verified" : "verification.disputed", tenantContext.tenantId);
  if (!result.replayIntegrity) {
    recordVerificationMetric("verification.replay_failed", tenantContext.tenantId);
  }
  if (mapping.blocked) {
    recordVerificationMetric("verification.mapping_blocked", tenantContext.tenantId);
  }

  if (!result.replayIntegrity) {
    return fail(
      RECOVERY_VERIFICATION_ERROR_CODES.RECOVERY_VERIFICATION_REPLAY_FAILED,
      "Replay integrity validation failed.",
      { result },
    );
  }
  if (!result.governanceIntegrity) {
    return fail(
      RECOVERY_VERIFICATION_ERROR_CODES.RECOVERY_VERIFICATION_GOVERNANCE_FAILED,
      "Governance integrity validation failed.",
      { result },
    );
  }
  if (disputes.blocking) {
    return fail(
      RECOVERY_VERIFICATION_ERROR_CODES.RECOVERY_VERIFICATION_DISPUTED,
      "Recovery verification is disputed.",
      { result },
    );
  }

  return {
    ok: true,
    data: result,
  };
}
