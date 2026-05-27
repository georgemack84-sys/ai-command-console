import type { SessionUser } from "@/src/lib/types";

import type { TenantContext } from "../tenancy/tenantTypes";
import { assertSecurityContext } from "./securityAssertions";
import { getPermissionsForRole } from "./rbacPolicy";
import type { Permission, SecurityContext, SecurityContextSource } from "./securityTypes";

export function createSecurityContext(input: {
  actorId: string;
  actorRole: SessionUser["role"];
  tenantId: string;
  workspaceId: string;
  permissions: Permission[];
  source: SecurityContextSource;
}): SecurityContext {
  const context: SecurityContext = {
    actorId: String(input.actorId || "").trim(),
    actorRole: input.actorRole,
    tenantId: String(input.tenantId || "").trim(),
    workspaceId: String(input.workspaceId || "").trim(),
    permissions: [...input.permissions],
    source: input.source,
  };
  assertSecurityContext(context);
  return context;
}

export function createSecurityContextFromSessionUser({
  user,
  tenantContext,
  additionalPermissions = [],
}: {
  user: SessionUser;
  tenantContext: TenantContext;
  additionalPermissions?: Permission[];
}) {
  return createSecurityContext({
    actorId: user.id,
    actorRole: user.role,
    tenantId: tenantContext.tenantId,
    workspaceId: tenantContext.workspaceId,
    permissions: [...new Set([...getPermissionsForRole(user.role), ...additionalPermissions])],
    source: "session",
  });
}
