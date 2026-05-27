import type { UserRole } from "@/src/lib/types";

export const SECURITY_CONTEXT_SOURCES = ["session", "apiKey", "test", "system"] as const;
export type SecurityContextSource = (typeof SECURITY_CONTEXT_SOURCES)[number];

export const PERMISSIONS = [
  "execution:read",
  "execution:mutate",
  "failure:classify",
  "failure:read",
  "failure:audit",
  "recovery:read",
  "recovery:run",
  "recovery:restore",
  "recovery:replay",
  "recovery:rollback",
  "recovery:reassign",
  "recovery:terminate",
  "recovery:supervise",
  "recovery:verify",
  "recovery:quarantine",
  "recovery:escalate",
  "recovery:override",
  "verification:read",
  "verification:run",
  "integrity:verify",
  "evidence:export",
  "tenant:admin",
  "backup:read",
  "backup:create",
  "backup:validate",
  "backup:run",
  "backup:restore",
  "system:admin",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type SecurityContext = {
  actorId: string;
  actorRole: UserRole;
  tenantId: string;
  workspaceId: string;
  permissions: Permission[];
  source: SecurityContextSource;
};

export type SecurityAuditDecision = "allowed" | "denied";
export type SecurityAuditEventType =
  | "auth.allowed"
  | "auth.denied"
  | "permission.denied"
  | "security.context_missing"
  | "tenant.scope_violation"
  | "replay.scope_violation"
  | "lock.scope_violation"
  | "export.denied"
  | "admin.denied";

export type SecurityAuthorizationSuccess = {
  ok: true;
  permission: Permission;
};

export type SecurityAuthorizationFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type PartialSecurityAuditScope = {
  actorId?: string | null;
  actorRole?: UserRole | string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
};
