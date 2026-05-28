export const SECURITY_ERROR_CODES = {
  SECURITY_CONTEXT_MISSING: "SECURITY_CONTEXT_MISSING",
  SECURITY_CONTEXT_INVALID: "SECURITY_CONTEXT_INVALID",
  SECURITY_PERMISSION_DENIED: "SECURITY_PERMISSION_DENIED",
  SECURITY_SCOPE_VIOLATION: "SECURITY_SCOPE_VIOLATION",
  SECURITY_AUDIT_WRITE_FAILED: "SECURITY_AUDIT_WRITE_FAILED",
} as const;

export class SecurityError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 403, details?: Record<string, unknown>) {
    super(message);
    this.name = "SecurityError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createSecurityError(
  code: string,
  message: string,
  status = 403,
  details?: Record<string, unknown>,
) {
  return new SecurityError(code, `${code}: ${message}`, status, details);
}
