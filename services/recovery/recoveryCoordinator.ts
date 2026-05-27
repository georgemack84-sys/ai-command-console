import { authorizeSecurityAction } from "../security/authorizationGuard";
import { classifyFailure } from "../failure/failureClassifier";
import { mapFailureClassificationToRecovery } from "../failure/failureRecoveryMapping";
import { recordFailureTelemetry } from "../failure/failureTelemetry";
import { getFrozenStartupStatus } from "../startup/startupStatus";
import { buildRecoveryVerificationRequirements } from "./recoveryVerification";
import { RECOVERY_COORDINATOR_ERROR_CODES } from "./recoveryCoordinatorErrors";
import { appendRecoveryCoordinationAuditEvent } from "./recoveryCoordinatorAudit";
import type { SecurityContext } from "../security/securityTypes";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { FailureEvidenceSources, FailureSignal } from "../failure/failureEvidence";

function blocked(code: string, message: string, details?: Record<string, unknown>) {
  return {
    ok: false as const,
    error: {
      code,
      message,
      details,
    },
  };
}

export async function coordinateRecovery({
  executionId,
  tenantContext,
  securityContext,
  signal,
  sources = {},
  nowMs,
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  signal?: FailureSignal;
  sources?: FailureEvidenceSources;
  nowMs?: number;
}) {
  const startupStatus = getFrozenStartupStatus();
  if (!startupStatus) {
    return blocked(RECOVERY_COORDINATOR_ERROR_CODES.STARTUP_GOVERNANCE_UNKNOWN, "Startup governance status is unknown.");
  }
  if (!startupStatus.ready) {
    return blocked(RECOVERY_COORDINATOR_ERROR_CODES.RUNTIME_SAFETY_DEGRADED, "Startup governance does not allow recovery supervision.");
  }

  if (securityContext) {
    const classifyPermission = await authorizeSecurityAction({
      securityContext,
      permission: "failure:classify",
      action: "failure.classify",
      resource: { executionId },
    });
    if (!classifyPermission.ok) {
      return blocked(classifyPermission.error.code, classifyPermission.error.message, classifyPermission.error.details);
    }

    const supervisePermission = await authorizeSecurityAction({
      securityContext,
      permission: "recovery:supervise",
      action: "recovery.supervise",
      resource: { executionId },
    });
    if (!supervisePermission.ok) {
      return blocked(supervisePermission.error.code, supervisePermission.error.message, supervisePermission.error.details);
    }
  }

  appendRecoveryCoordinationAuditEvent({
    type: "failure.detected",
    executionId,
    actorId: securityContext?.actorId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: { signal: signal?.type || null },
  });

  const classification = await classifyFailure({
    executionId,
    tenantContext,
    signal,
    sources: {
      ...sources,
      startupStatus,
    },
    nowMs,
  });

  if (!classification.ok) {
    recordFailureTelemetry({
      tenantContext,
      classification: classification.classification || null,
      event: classification.error.code === "FAILURE_CLASSIFICATION_LOW_CONFIDENCE"
        ? "classification.low_confidence"
        : "classification.disputed",
    });
    appendRecoveryCoordinationAuditEvent({
      type: classification.error.code === "FAILURE_CLASSIFICATION_DISPUTED"
        ? "failure.classification.disputed"
        : "failure.truth.failed",
      executionId,
      actorId: securityContext?.actorId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: {
        reason: classification.error.code,
        evidence: classification.classification?.evidence || [],
      },
    });
    return classification;
  }

  appendRecoveryCoordinationAuditEvent({
    type: "failure.evidence.collected",
    executionId,
    actorId: securityContext?.actorId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: { evidence: classification.data.evidence },
  });
  appendRecoveryCoordinationAuditEvent({
    type: "failure.classified",
    executionId,
    actorId: securityContext?.actorId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: { classificationId: classification.data.classificationId, category: classification.data.category },
  });
  appendRecoveryCoordinationAuditEvent({
    type: "failure.severity.assigned",
    executionId,
    actorId: securityContext?.actorId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: { severity: classification.data.severity },
  });

  const mapping = mapFailureClassificationToRecovery(classification.data);
  recordFailureTelemetry({
    tenantContext,
    classification: classification.data,
    mapping,
    event: "classification.total",
  });

  appendRecoveryCoordinationAuditEvent({
    type: "failure.recovery.mapped",
    executionId,
    actorId: securityContext?.actorId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: { mapping },
  });

  if (classification.data.requiresApproval) {
    appendRecoveryCoordinationAuditEvent({
      type: "failure.approval.required",
      executionId,
      actorId: securityContext?.actorId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: { category: classification.data.category },
    });
  }

  if (classification.data.requiresEscalation) {
    appendRecoveryCoordinationAuditEvent({
      type: "failure.escalation.required",
      executionId,
      actorId: securityContext?.actorId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: { category: classification.data.category },
    });
  }

  if (mapping.blocked) {
    return blocked(mapping.reason, "Recovery coordination blocked by classified failure state.", {
      classification: classification.data,
      mapping,
    });
  }

  return {
    ok: true as const,
    data: {
      coordinationId: `coordination_${classification.data.classificationId}`,
      status: classification.data.requiresEscalation ? "ESCALATED" : "CLASSIFIED",
      failureClassificationId: classification.data.classificationId,
      classification: classification.data,
      approvalRequired: classification.data.requiresApproval,
      escalationRequired: classification.data.requiresEscalation,
      verification: buildRecoveryVerificationRequirements({
        classification: classification.data,
        mapping,
      }),
      mapping,
    },
  };
}
