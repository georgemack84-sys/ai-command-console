import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildMissionConsoleSeedContext, buildMissionConsoleView } from "@/services/mission-intelligence-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const executionId = String(new URL(request.url).searchParams.get("executionId") || "mission-execution-001");
    return apiSuccess(buildMissionConsoleView(buildMissionConsoleSeedContext({ executionId })).replay);
  } catch (error) {
    return apiError(error, "Unable to load replay domain.");
  }
}
