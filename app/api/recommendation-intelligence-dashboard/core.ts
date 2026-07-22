import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecommendationDashboardObservabilitySurface,
  buildRecommendationIntelligenceDashboard,
  getRecommendationIntelligenceDashboardContract,
  validateRecommendationIntelligenceDashboard,
} from "@/services/recommendation-intelligence-dashboard";
import type { RecommendationDashboardInput, RecommendationDashboardResult } from "@/types/recommendation-intelligence-dashboard";

export async function requireRecommendationDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecommendationDashboardInput {
  return body as RecommendationDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): RecommendationDashboardResult {
  return (body.result as RecommendationDashboardResult | undefined) ?? buildRecommendationIntelligenceDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getRecommendationIntelligenceDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildRecommendationIntelligenceDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateRecommendationIntelligenceDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "lifecycle_dashboard" | "effectiveness_dashboard" | "confidence_dashboard" | "risk_dashboard" | "operator_dashboard" | "quality_dashboard" | "failure_dashboard" | "history_explorer" | "replay_explorer" | "trend_dashboard",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildRecommendationDashboardObservabilitySurface();
  return buildRecommendationDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
