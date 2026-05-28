import type { SessionUser } from "@/src/lib/types";

import { TENANT_ERROR_CODES, createTenantScopeError } from "./tenantErrors";
import { createTenantContext } from "./tenantContext";

export function resolveTenantContextFromSessionUser({
  user,
  request,
}: {
  user: SessionUser;
  request?: Request;
}) {
  const requestedTenantId = request?.headers.get("x-tenant-id")?.trim() || "";
  const requestedWorkspaceId = request?.headers.get("x-workspace-id")?.trim() || "";
  const workspaceId = String(user?.workspaceId || "").trim();

  if (!workspaceId) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_WORKSPACE_MISSING, `${TENANT_ERROR_CODES.TENANT_WORKSPACE_MISSING}: Session workspace is required.`, 400);
  }

  if (requestedTenantId && requestedTenantId !== workspaceId) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH, `${TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH}: Tenant header does not match the session workspace.`);
  }
  if (requestedWorkspaceId && requestedWorkspaceId !== workspaceId) {
    throw createTenantScopeError(TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH, `${TENANT_ERROR_CODES.TENANT_SCOPE_MISMATCH}: Workspace header does not match the session workspace.`);
  }

  return createTenantContext({
    tenantId: requestedTenantId || workspaceId,
    workspaceId,
    operatorId: user.id,
    source: "session",
  });
}
