import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceLineageExplorerView, getGovernanceLineageExplorerContract } from "@/services/governance-lineage-explorer";
import type { GovernanceLineageExplorerInput } from "@/types/governance-lineage-explorer";

export async function requireGovernanceLineageExplorerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceLineageExplorerParams(request: Request): GovernanceLineageExplorerInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    operator_id: url.searchParams.get("operatorId") ?? "operator_console",
    selected_node_id: url.searchParams.get("selectedNodeId") ?? undefined,
    state: (url.searchParams.get("state") || undefined) as GovernanceLineageExplorerInput["state"],
  };
}

export function viewForRequest(request: Request) {
  return buildGovernanceLineageExplorerView(readGovernanceLineageExplorerParams(request));
}

export function contractResponse() {
  return getGovernanceLineageExplorerContract();
}
