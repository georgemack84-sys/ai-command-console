import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceDashboardView, getGovernanceDashboardContract } from "@/services/governance-dashboard";
import type { GovernanceDashboardInput, GovernanceDashboardView } from "@/types/governance-dashboard";

export async function requireGovernanceDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceDashboardParams(request: Request): GovernanceDashboardInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? "tenant_alpha",
    mission_id: url.searchParams.get("missionId") ?? "mission_governance_001",
    operator_id: url.searchParams.get("operatorId") ?? "operator_console",
    certification_status: (url.searchParams.get("certificationStatus") || undefined) as GovernanceDashboardInput["certification_status"],
  };
}

async function inputFromRequest(request: Request): Promise<GovernanceDashboardInput> {
  if (request.method === "GET") return readGovernanceDashboardParams(request);
  return await request.json().catch(() => readGovernanceDashboardParams(request)) as GovernanceDashboardInput;
}

function hashDashboard(view: GovernanceDashboardView) {
  return { dashboard_id: view.dashboard_id, dashboard_hash: view.dashboard_hash, schema_version: view.schema_version };
}

export function getGovernanceDashboardContractResponse() {
  return getGovernanceDashboardContract();
}

export async function getGovernanceDashboardViewRequest(request: Request) {
  return buildGovernanceDashboardView(await inputFromRequest(request));
}

export async function getGovernanceDashboardMetadataRequest(request: Request) {
  const view = buildGovernanceDashboardView(await inputFromRequest(request));
  return {
    dashboard_id: view.dashboard_id,
    schema_version: view.schema_version,
    read_only: view.read_only,
    advisory_only: view.advisory_only,
    tenant_isolated: view.tenant_isolated,
    authorization_enforced: view.authorization_enforced,
    deterministic_ordering: view.deterministic_ordering,
    widgets: view.widgets,
    dashboard_hash: view.dashboard_hash,
  };
}

export async function getGovernanceDashboardHashRequest(request: Request) {
  return hashDashboard(buildGovernanceDashboardView(await inputFromRequest(request)));
}
