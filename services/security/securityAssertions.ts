import { SECURITY_ERROR_CODES, createSecurityError } from "./securityErrors";
import { PERMISSIONS, type Permission, type SecurityContext } from "./securityTypes";

const KNOWN_PERMISSIONS = new Set<string>(PERMISSIONS);

export function assertKnownPermission(permission: string): asserts permission is Permission {
  if (!KNOWN_PERMISSIONS.has(String(permission || "").trim())) {
    throw createSecurityError(
      SECURITY_ERROR_CODES.SECURITY_CONTEXT_INVALID,
      `Unknown permission "${permission}".`,
      400,
    );
  }
}

export function assertSecurityContext(value: SecurityContext | null | undefined): asserts value is SecurityContext {
  if (!value) {
    throw createSecurityError(SECURITY_ERROR_CODES.SECURITY_CONTEXT_MISSING, "Security context is required.", 403);
  }
  if (!String(value.actorId || "").trim() || !String(value.tenantId || "").trim() || !String(value.workspaceId || "").trim()) {
    throw createSecurityError(SECURITY_ERROR_CODES.SECURITY_CONTEXT_INVALID, "Security context is incomplete.", 403);
  }
  if (!Array.isArray(value.permissions) || value.permissions.length === 0) {
    throw createSecurityError(SECURITY_ERROR_CODES.SECURITY_CONTEXT_INVALID, "Security context permissions are required.", 403);
  }
  for (const permission of value.permissions) {
    assertKnownPermission(permission);
  }
}
