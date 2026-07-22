import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildStrategyEvolutionDashboard,
  buildStrategyEvolutionDashboardObservabilitySurface,
  getStrategyEvolutionDashboardContract,
  validateStrategyEvolutionDashboard,
} from "@/services/strategy-evolution-dashboard";
import type { StrategyEvolutionDashboardInput, StrategyEvolutionDashboardResult } from "@/types/strategy-evolution-dashboard";

export async function requireStrategyEvolutionDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): StrategyEvolutionDashboardInput {
  return body as StrategyEvolutionDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): StrategyEvolutionDashboardResult {
  return (body.result as StrategyEvolutionDashboardResult | undefined) ?? buildStrategyEvolutionDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getStrategyEvolutionDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildStrategyEvolutionDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateStrategyEvolutionDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "proposal_queue" | "detail_view" | "comparison_workspace" | "benefit_dashboard" | "risk_dashboard" | "governance_view" | "simulation_view" | "approval_view" | "certification_view" | "replay_view" | "rollback_view" | "historical_explorer" | "alert_panel" | "lineage_explorer",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildStrategyEvolutionDashboardObservabilitySurface();
  return buildStrategyEvolutionDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
