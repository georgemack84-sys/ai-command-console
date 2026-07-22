import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDashboardObservability,
  buildDashboardObservabilitySurface,
  getDashboardObservabilityContract,
  validateDashboardObservability,
} from "@/services/dashboard-observability";
import type { DashboardObservabilityInput, DashboardObservabilityResult } from "@/types/dashboard-observability";

export async function requireDashboardObservabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DashboardObservabilityInput {
  return body as DashboardObservabilityInput;
}

function resultFromBody(body: Record<string, unknown>): DashboardObservabilityResult {
  return (body.result as DashboardObservabilityResult | undefined) ?? buildDashboardObservability(inputFromBody(body));
}

export function contractResponse() {
  return getDashboardObservabilityContract();
}

export async function dashboardRequest(request: Request) {
  return buildDashboardObservability(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateDashboardObservability(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "metrics_service" | "usage_analytics" | "visibility_validator" | "performance_monitor" | "freshness_monitor" | "lineage_monitor" | "replay_monitor" | "reference_monitor" | "approval_monitor" | "certification_monitor" | "widget_monitor" | "navigation_monitor" | "health_evaluation" | "alerts" | "incidents" | "ledger" | "health_report" | "console",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildDashboardObservabilitySurface();
  return buildDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
