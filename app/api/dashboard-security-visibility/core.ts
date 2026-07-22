import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDashboardSecurityObservabilitySurface,
  buildDashboardSecurityVisibility,
  getDashboardSecurityContract,
  validateDashboardSecurityVisibility,
} from "@/services/dashboard-security-visibility";
import type { DashboardSecurityInput, DashboardSecurityResult } from "@/types/dashboard-security-visibility";

export async function requireDashboardSecurityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DashboardSecurityInput {
  return body as DashboardSecurityInput;
}

function resultFromBody(body: Record<string, unknown>): DashboardSecurityResult {
  return (body.result as DashboardSecurityResult | undefined) ?? buildDashboardSecurityVisibility(inputFromBody(body));
}

export function contractResponse() {
  return getDashboardSecurityContract();
}

export async function dashboardRequest(request: Request) {
  return buildDashboardSecurityVisibility(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateDashboardSecurityVisibility(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "decision" | "security_contract" | "tenant_isolation" | "role_permissions" | "mission_visibility" | "field_access" | "guard_surface" | "search_aggregation" | "redaction_export_cache" | "security_ledger" | "alert_center",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildDashboardSecurityObservabilitySurface();
  return buildDashboardSecurityObservabilitySurface(resultFromBody(await readBody(request)));
}
