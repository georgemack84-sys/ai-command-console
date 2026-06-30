import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildGovernanceReplayViewerView, getGovernanceReplayViewerContract } from "@/services/governance-replay-viewer";
import type { GovernanceReplayViewerInput } from "@/types/governance-replay-viewer";

export async function requireGovernanceReplayViewerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readGovernanceReplayViewerParams(request: Request): GovernanceReplayViewerInput {
  const url = new URL(request.url);
  return {
    tenant_id: url.searchParams.get("tenantId") ?? "tenant_alpha",
    mission_id: url.searchParams.get("missionId") ?? "mission_governance_001",
    operator_id: url.searchParams.get("operatorId") ?? "operator_console",
    replay_id: url.searchParams.get("replayId") ?? undefined,
    state: (url.searchParams.get("state") || undefined) as GovernanceReplayViewerInput["state"],
  };
}

export function viewForRequest(request: Request) {
  return buildGovernanceReplayViewerView(readGovernanceReplayViewerParams(request));
}

export function contractResponse() {
  return getGovernanceReplayViewerContract();
}
