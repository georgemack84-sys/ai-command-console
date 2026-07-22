import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildProposedResponseDashboard,
  buildProposedResponseDashboardObservabilitySurface,
  getProposedResponseDashboardContract,
  validateProposedResponseDashboard,
} from "@/services/proposed-response-dashboard";
import type { ProposedResponseDashboardInput, ProposedResponseDashboardResult } from "@/types/proposed-response-dashboard";

export async function requireProposedResponseDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ProposedResponseDashboardInput {
  return body as ProposedResponseDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): ProposedResponseDashboardResult {
  return (body.result as ProposedResponseDashboardResult | undefined) ?? buildProposedResponseDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getProposedResponseDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildProposedResponseDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateProposedResponseDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "proposal_queue" | "detail_view" | "rationale_view" | "benefit_view" | "risk_view" | "affected_scope_view" | "simulation_view" | "governance_view" | "certification_view" | "lineage_explorer" | "evidence_workspace" | "replay_view" | "comparison_workspace" | "alert_center" | "next_action_panel" | "audit_records",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildProposedResponseDashboardObservabilitySurface();
  return buildProposedResponseDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
