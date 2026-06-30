import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceIntegrityViewerView, getGovernanceIntegrityViewerContract } from "@/services/governance-integrity-viewer";
import type { GovernanceIntegrityViewerInput } from "@/types/governance-integrity-viewer";

export async function requireGovernanceIntegrityViewerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceIntegrityViewerParams(request: Request): GovernanceIntegrityViewerInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? undefined,
    mission_id: url.searchParams.get("missionId") ?? undefined,
    operator_id: url.searchParams.get("operatorId") ?? "operator_console",
    state: (url.searchParams.get("state") || undefined) as GovernanceIntegrityViewerInput["state"],
  };
}

export function viewForRequest(request: Request) {
  return buildGovernanceIntegrityViewerView(readGovernanceIntegrityViewerParams(request));
}

export function contractResponse() {
  return getGovernanceIntegrityViewerContract();
}
