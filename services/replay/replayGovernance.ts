import { authorizeSecurityAction } from "../security/authorizationGuard";
import { appendReplayAuditEvent } from "./replayAudit";
import { getReplayPolicy } from "./replayPolicies";
import { REPLAY_ACTION_PERMISSIONS, type ReplayGovernedAction } from "./replayPermissions";
import type { SecurityContext } from "../security/securityTypes";
import type { TenantContext } from "../tenancy/tenantTypes";

export async function evaluateReplayGovernance({
  executionId,
  tenantContext,
  securityContext,
  action,
  replayVerification,
  activeRecoveryActions = [],
}: {
  executionId: string;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  action: ReplayGovernedAction;
  replayVerification:
    | { ok: true; data: { verified: boolean; deterministic: boolean; confidence: { score: number; confidenceLevel: string; deterministic: boolean; riskFactors: string[]; verifiedEvidence: string[]; warnings: string[] }; divergences: Array<{ category: string; severity: string; requiresEscalation: boolean }> } }
    | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };
  activeRecoveryActions?: string[];
}) {
  const permission = REPLAY_ACTION_PERMISSIONS[action];
  if (securityContext) {
    const authorization = await authorizeSecurityAction({
      securityContext,
      permission,
      action: `replay.${action}`,
      resource: { executionId },
    });
    if (!authorization.ok) {
      return {
        ok: false as const,
        error: authorization.error,
      };
    }
  }

  const policy = getReplayPolicy(action);
  if (!replayVerification.ok) {
    appendReplayAuditEvent({
      type: "replay.blocked",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: {
        action,
        reason: replayVerification.error.code,
      },
    });
    return {
      ok: false as const,
      error: {
        code: "REPLAY_GOVERNANCE_BLOCKED",
        message: "Replay governance blocked because replay verification failed.",
        details: {
          action,
          replayVerification: replayVerification.error,
        },
      },
    };
  }

  if (policy.requiresEvidence && replayVerification.data.confidence.verifiedEvidence.length === 0) {
    return {
      ok: false as const,
      error: {
        code: "REPLAY_GOVERNANCE_BLOCKED",
        message: "Replay governance requires evidence before replay can proceed.",
        details: { action },
      },
    };
  }

  if (activeRecoveryActions.length > 0 && !activeRecoveryActions.includes(action)) {
    appendReplayAuditEvent({
      type: "recovery.governance.blocked",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: {
        action,
        conflictingActions: activeRecoveryActions,
      },
    });
    return {
      ok: false as const,
      error: {
        code: "REPLAY_GOVERNANCE_BLOCKED",
        message: "Conflicting recovery actions are already active.",
        details: {
          action,
          conflictingActions: activeRecoveryActions,
        },
      },
    };
  }

  if (policy.blocksOnDispute && (!replayVerification.data.verified || replayVerification.data.divergences.length > 0)) {
    appendReplayAuditEvent({
      type: action === "quarantine" ? "replay.quarantined" : "replay.blocked",
      executionId,
      tenantId: tenantContext.tenantId,
      workspaceId: tenantContext.workspaceId,
      payload: {
        action,
        divergences: replayVerification.data.divergences,
      },
    });
    return {
      ok: false as const,
      error: {
        code: "REPLAY_GOVERNANCE_BLOCKED",
        message: "Replay governance blocked due to disputed replay truth.",
        details: {
          action,
          divergences: replayVerification.data.divergences,
        },
      },
    };
  }

  if (policy.blocksOnNonDeterminism && !replayVerification.data.deterministic) {
    return {
      ok: false as const,
      error: {
        code: "REPLAY_GOVERNANCE_BLOCKED",
        message: "Replay governance blocked due to non-deterministic replay.",
        details: { action },
      },
    };
  }

  appendReplayAuditEvent({
    type: "recovery.governance.approved",
    executionId,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    payload: {
      action,
      confidence: replayVerification.data.confidence.score,
    },
  });

  return {
    ok: true as const,
    data: {
      approved: true,
      action,
      permission,
      confidence: replayVerification.data.confidence,
    },
  };
}
