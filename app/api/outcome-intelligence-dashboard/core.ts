import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildOutcomeDashboardObservabilitySurface,
  buildOutcomeIntelligenceDashboard,
  getOutcomeIntelligenceDashboardContract,
  validateOutcomeIntelligenceDashboard,
} from "@/services/outcome-intelligence-dashboard";
import type { OutcomeDashboardInput, OutcomeDashboardResult } from "@/types/outcome-intelligence-dashboard";

export async function requireOutcomeDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): OutcomeDashboardInput {
  return body as OutcomeDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): OutcomeDashboardResult {
  return (body.result as OutcomeDashboardResult | undefined) ?? buildOutcomeIntelligenceDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getOutcomeIntelligenceDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildOutcomeIntelligenceDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateOutcomeIntelligenceDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "recent_outcomes" | "success_trends" | "failure_trends" | "mission_impact" | "outcome_categories" | "confidence_realization" | "risk_realization" | "governance_outcomes" | "rollback_outcomes" | "historical_comparison" | "replay_integration",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildOutcomeDashboardObservabilitySurface();
  return buildOutcomeDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
