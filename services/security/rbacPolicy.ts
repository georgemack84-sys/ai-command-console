import type { UserRole } from "@/src/lib/types";

import type { Permission } from "./securityTypes";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    "execution:read",
    "failure:read",
    "recovery:read",
    "verification:read",
  ],
  operator: [
    "execution:read",
    "failure:classify",
    "failure:read",
    "failure:audit",
    "recovery:read",
    "recovery:replay",
    "recovery:run",
    "recovery:supervise",
    "recovery:verify",
    "verification:read",
    "verification:run",
  ],
  approver: [
    "execution:read",
    "failure:read",
    "failure:audit",
    "recovery:read",
    "recovery:verify",
    "recovery:escalate",
    "verification:read",
    "evidence:export",
  ],
  admin: [
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
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

export function hasPermission(permissions: readonly Permission[], permission: Permission) {
  return permissions.includes(permission);
}

export function isKnownPermission(permission: string) {
  return ([
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
  ] as const).includes(permission as Permission);
}
