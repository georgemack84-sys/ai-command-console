import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildOperatorImpactDashboard,
  buildOperatorImpactDashboardObservabilitySurface,
  getOperatorImpactDashboardContract,
  validateOperatorImpactDashboard,
} from "@/services/operator-impact-dashboard";
import type { OperatorImpactDashboardInput, OperatorImpactDashboardResult } from "@/types/operator-impact-dashboard";

export async function requireOperatorImpactDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): OperatorImpactDashboardInput {
  return body as OperatorImpactDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): OperatorImpactDashboardResult {
  return (body.result as OperatorImpactDashboardResult | undefined) ?? buildOperatorImpactDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getOperatorImpactDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildOperatorImpactDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateOperatorImpactDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "affected_operator_view" | "trend_explorer" | "override_pattern_view" | "approval_behavior_view" | "review_latency_view" | "consistency_view" | "workload_distribution_view" | "comparison_workspace" | "historical_trend_explorer" | "replay_explorer" | "context_panel" | "alert_center" | "audit_records",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildOperatorImpactDashboardObservabilitySurface();
  return buildOperatorImpactDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
