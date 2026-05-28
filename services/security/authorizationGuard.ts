import { assertKnownPermission, assertSecurityContext } from "./securityAssertions";
import { hasPermission } from "./rbacPolicy";
import { appendSecurityAuditEvent, appendSecurityContextAuditEvent } from "./securityAudit";
import { SECURITY_ERROR_CODES } from "./securityErrors";
import type { Permission, SecurityAuthorizationFailure, SecurityAuthorizationSuccess, SecurityContext } from "./securityTypes";

function denied(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): SecurityAuthorizationFailure {
  return {
    ok: false,
    error: {
      code,
      message: `${code}: ${message}`,
      details,
    },
  };
}

export async function authorizeSecurityAction({
  securityContext,
  permission,
  action,
  resource,
}: {
  securityContext: SecurityContext;
  permission: Permission;
  action: string;
  resource?: Record<string, unknown>;
}): Promise<SecurityAuthorizationSuccess | SecurityAuthorizationFailure> {
  try {
    assertSecurityContext(securityContext);
    assertKnownPermission(permission);
  } catch (error) {
    const code = (error as any)?.code || SECURITY_ERROR_CODES.SECURITY_CONTEXT_INVALID;
    const message = error instanceof Error ? error.message : "Security context validation failed.";
    try {
      appendSecurityContextAuditEvent({
        type: code === SECURITY_ERROR_CODES.SECURITY_CONTEXT_MISSING ? "security.context_missing" : "auth.denied",
        scope: {
          actorId: (securityContext as any)?.actorId ?? null,
          actorRole: (securityContext as any)?.actorRole ?? null,
          tenantId: (securityContext as any)?.tenantId ?? null,
          workspaceId: (securityContext as any)?.workspaceId ?? null,
        },
        requiredPermission: permission,
        action,
        reason: code,
        resource,
      });
    } catch (auditError) {
      return denied(
        SECURITY_ERROR_CODES.SECURITY_AUDIT_WRITE_FAILED,
        auditError instanceof Error ? auditError.message : "Security audit write failed.",
      );
    }
    return denied(code, message, (error as any)?.details);
  }

  if (!hasPermission(securityContext.permissions, permission)) {
    try {
      appendSecurityAuditEvent({
        type:
          permission === "evidence:export"
            ? "export.denied"
            : permission === "system:admin"
              ? "admin.denied"
              : "permission.denied",
        actorId: securityContext.actorId,
        actorRole: securityContext.actorRole,
        tenantId: securityContext.tenantId,
        workspaceId: securityContext.workspaceId,
        requiredPermission: permission,
        action,
        decision: "denied",
        reason: SECURITY_ERROR_CODES.SECURITY_PERMISSION_DENIED,
        resource,
      });
    } catch (error) {
      return denied(
        SECURITY_ERROR_CODES.SECURITY_AUDIT_WRITE_FAILED,
        error instanceof Error ? error.message : "Security audit write failed.",
      );
    }

    return denied(
      SECURITY_ERROR_CODES.SECURITY_PERMISSION_DENIED,
      `Permission "${permission}" is required for ${action}.`,
      {
        permission,
        action,
      },
    );
  }

  try {
    appendSecurityAuditEvent({
      type: "auth.allowed",
      actorId: securityContext.actorId,
      actorRole: securityContext.actorRole,
      tenantId: securityContext.tenantId,
      workspaceId: securityContext.workspaceId,
      requiredPermission: permission,
      action,
      decision: "allowed",
      resource,
    });
  } catch (error) {
    return denied(
      SECURITY_ERROR_CODES.SECURITY_AUDIT_WRITE_FAILED,
      error instanceof Error ? error.message : "Security audit write failed.",
    );
  }

  return {
    ok: true,
    permission,
  };
}
