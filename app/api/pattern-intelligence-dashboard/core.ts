import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPatternIntelligenceDashboard,
  buildPatternIntelligenceDashboardObservabilitySurface,
  getPatternIntelligenceDashboardContract,
  validatePatternIntelligenceDashboard,
} from "@/services/pattern-intelligence-dashboard";
import type { PatternIntelligenceDashboardInput, PatternIntelligenceDashboardResult } from "@/types/pattern-intelligence-dashboard";

export async function requirePatternIntelligenceDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PatternIntelligenceDashboardInput {
  return body as PatternIntelligenceDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): PatternIntelligenceDashboardResult {
  return (body.result as PatternIntelligenceDashboardResult | undefined) ?? buildPatternIntelligenceDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getPatternIntelligenceDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildPatternIntelligenceDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validatePatternIntelligenceDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "pattern_records" | "timeline_explorer" | "relationship_graph" | "mission_analytics" | "confidence_dashboard" | "strategic_impact_dashboard" | "governance_impact_dashboard" | "evidence_explorer" | "operator_impact_dashboard" | "proposed_response_dashboard" | "replay_explorer" | "trend_analytics",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildPatternIntelligenceDashboardObservabilitySurface();
  return buildPatternIntelligenceDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
