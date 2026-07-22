import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceApprovalDashboard,
  buildGovernanceApprovalDashboardObservabilitySurface,
  getGovernanceApprovalDashboardContract,
  validateGovernanceApprovalDashboard,
} from "@/services/governance-approval-dashboard";
import type { GovernanceApprovalDashboardInput, GovernanceApprovalDashboardResult } from "@/types/governance-approval-dashboard";

export async function requireGovernanceApprovalDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceApprovalDashboardInput {
  return body as GovernanceApprovalDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): GovernanceApprovalDashboardResult {
  return (body.result as GovernanceApprovalDashboardResult | undefined) ?? buildGovernanceApprovalDashboard(inputFromBody(body));
}

export function contractResponse() {
  return getGovernanceApprovalDashboardContract();
}

export async function dashboardRequest(request: Request) {
  return buildGovernanceApprovalDashboard(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateGovernanceApprovalDashboard(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "approval_queue" | "detail_view" | "governance_status_view" | "blocker_registry" | "constitutional_view" | "authority_view" | "operator_workspace" | "dependency_graph" | "escalation_timeline" | "certification_queue" | "replay_view" | "rollback_view" | "evidence_workspace" | "decision_history" | "alert_center",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildGovernanceApprovalDashboardObservabilitySurface();
  return buildGovernanceApprovalDashboardObservabilitySurface(resultFromBody(await readBody(request)));
}
