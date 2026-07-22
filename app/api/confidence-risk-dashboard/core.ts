import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildConfidenceRiskDashboard,
  buildConfidenceRiskDashboardObservabilitySurface,
  getConfidenceRiskDashboardContract,
  validateConfidenceRiskDashboard,
} from "@/services/confidence-risk-dashboard";
import type { ConfidenceRiskDashboardInput, ConfidenceRiskDashboardResult } from "@/types/confidence-risk-dashboard";

export async function requireConfidenceRiskDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ConfidenceRiskDashboardInput {
  return body as ConfidenceRiskDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): ConfidenceRiskDashboardResult {
  return (body.result as ConfidenceRiskDashboardResult | undefined) ?? buildConfidenceRiskDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getConfidenceRiskDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildConfidenceRiskDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateConfidenceRiskDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "calibration_view" | "trend_view" | "timeline" | "drift_view" | "evidence_view" | "confidence_proposal_view" | "risk_adaptation_view" | "severity_view" | "probability_view" | "actualization_explorer" | "governance_risk_view" | "comparison_workspace" | "proposal_status_panel" | "replay_explorer" | "alert_center",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildConfidenceRiskDashboardObservabilitySurface();
  return buildConfidenceRiskDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
