import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { runTruthLedgerCompletionGate } from "@/services/truth-ledger-completion";

export async function requireTruthLedgerCompletionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function getTruthLedgerCompletionForRequest(request: Request) {
  const url = new URL(request.url);
  return runTruthLedgerCompletionGate({
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    mission_id: String(url.searchParams.get("missionId") || "mission_query_layer"),
  });
}
