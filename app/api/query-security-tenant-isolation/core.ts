import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildQuerySecurityTenantIsolationObservabilitySurface,
  getQuerySecurityTenantIsolationContract,
  runQuerySecurityTenantIsolation,
  validateQuerySecurityTenantIsolation,
} from "@/services/query-security-tenant-isolation";
import type { QuerySecurityTenantIsolationInput, QuerySecurityTenantIsolationResponse } from "@/types/query-security-tenant-isolation";

export async function requireQuerySecurityTenantIsolationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): QuerySecurityTenantIsolationInput {
  return body as QuerySecurityTenantIsolationInput;
}

function responseFromBody(body: Record<string, unknown>): QuerySecurityTenantIsolationResponse {
  return (body.response as QuerySecurityTenantIsolationResponse | undefined) ?? runQuerySecurityTenantIsolation(inputFromBody(body));
}

export function getQuerySecurityTenantIsolationContractResponse() { return getQuerySecurityTenantIsolationContract(); }
export async function authorizeQuerySecurityTenantIsolationRequest(request: Request) { return runQuerySecurityTenantIsolation(inputFromBody(await readBody(request))); }
export async function validateQuerySecurityTenantIsolationRequest(request: Request) { return validateQuerySecurityTenantIsolation(inputFromBody(await readBody(request))); }
export async function auditQuerySecurityTenantIsolationRequest(request: Request) { return responseFromBody(await readBody(request)).audit_record; }
export async function inspectQuerySecurityTenantIsolationRequest(request?: Request) {
  if (!request) return buildQuerySecurityTenantIsolationObservabilitySurface();
  return buildQuerySecurityTenantIsolationObservabilitySurface(inputFromBody(await readBody(request)));
}
