import * as auditTrail from "../auditTrail.js";
import type { PartialSecurityAuditScope, Permission, SecurityAuditDecision, SecurityAuditEventType } from "./securityTypes";
import { SECURITY_ERROR_CODES, createSecurityError } from "./securityErrors";

export function appendSecurityAuditEvent({
  type,
  actorId,
  actorRole,
  tenantId,
  workspaceId,
  requiredPermission,
  action,
  decision,
  reason,
  resource,
}: {
  type: SecurityAuditEventType;
  actorId?: string | null;
  actorRole?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  requiredPermission: Permission;
  action: string;
  decision: SecurityAuditDecision;
  reason?: string;
  resource?: Record<string, unknown>;
}) {
  if (typeof auditTrail.appendAuditEvent !== "function") {
    throw createSecurityError(
      SECURITY_ERROR_CODES.SECURITY_AUDIT_WRITE_FAILED,
      "Security audit API is unavailable.",
      500,
    );
  }

  try {
    return auditTrail.appendAuditEvent({
      actor: "operator",
      type,
      message: `${type} for ${action}`,
      tenantId: tenantId ?? null,
      workspaceId: workspaceId ?? null,
      actorId: actorId ?? null,
      actorRole: actorRole ?? null,
      requiredPermission,
      requestedAction: action,
      decision,
      reason: reason || null,
      resource,
      payload: {
        actorId: actorId ?? null,
        actorRole: actorRole ?? null,
        tenantId: tenantId ?? null,
        workspaceId: workspaceId ?? null,
        requiredPermission,
        requestedAction: action,
        decision,
        reason: reason || null,
        resource: resource || null,
      },
    });
  } catch (error) {
    throw createSecurityError(
      SECURITY_ERROR_CODES.SECURITY_AUDIT_WRITE_FAILED,
      error instanceof Error ? error.message : "Security audit write failed.",
      500,
    );
  }
}

export function appendSecurityContextAuditEvent({
  type,
  scope,
  requiredPermission,
  action,
  reason,
  resource,
}: {
  type: SecurityAuditEventType;
  scope?: PartialSecurityAuditScope;
  requiredPermission: Permission;
  action: string;
  reason?: string;
  resource?: Record<string, unknown>;
}) {
  return appendSecurityAuditEvent({
    type,
    actorId: scope?.actorId ?? null,
    actorRole: scope?.actorRole ?? null,
    tenantId: scope?.tenantId ?? null,
    workspaceId: scope?.workspaceId ?? null,
    requiredPermission,
    action,
    decision: "denied",
    reason,
    resource,
  });
}
