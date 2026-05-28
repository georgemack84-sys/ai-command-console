export const TENANT_ERROR_CODES = {
  TENANT_CONTEXT_MISSING: "TENANT_CONTEXT_MISSING",
  TENANT_ID_MISSING: "TENANT_ID_MISSING",
  TENANT_WORKSPACE_MISSING: "TENANT_WORKSPACE_MISSING",
  TENANT_SCOPE_MISMATCH: "TENANT_SCOPE_MISMATCH",
  TENANT_UNSCOPED_QUERY_BLOCKED: "TENANT_UNSCOPED_QUERY_BLOCKED",
  TENANT_LOCK_SCOPE_MISMATCH: "TENANT_LOCK_SCOPE_MISMATCH",
  TENANT_CROSS_READ_BLOCKED: "TENANT_CROSS_READ_BLOCKED",
  TENANT_CROSS_WRITE_BLOCKED: "TENANT_CROSS_WRITE_BLOCKED",
  TENANT_OBSERVABILITY_SCOPE_MISMATCH: "TENANT_OBSERVABILITY_SCOPE_MISMATCH",
  TENANT_RECOVERY_SCOPE_MISMATCH: "TENANT_RECOVERY_SCOPE_MISMATCH",
  TENANT_SAM_SCOPE_MISMATCH: "TENANT_SAM_SCOPE_MISMATCH",
  TENANT_CONTRACT_SCOPE_MISMATCH: "TENANT_CONTRACT_SCOPE_MISMATCH",
} as const;

export class TenantScopeError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 403, details?: Record<string, unknown>) {
    super(message);
    this.name = "TenantScopeError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createTenantScopeError(
  code: string,
  message: string,
  status = 403,
  details?: Record<string, unknown>,
) {
  return new TenantScopeError(code, message, status, details);
}
