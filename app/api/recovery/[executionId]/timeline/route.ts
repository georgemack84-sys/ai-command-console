import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { getRecoveryOperatorTimeline } from "@/controllers/recoveryOperatorController";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ executionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { executionId } = await context.params;
    const result = await getRecoveryOperatorTimeline({ executionId });
    if (!result.ok) {
      throw new AppError(409, result.error, result.reason || "Recovery timeline is blocked.");
    }
    return apiSuccess(result.data);
  } catch (error) {
    return apiError(error, "Unable to load recovery timeline.");
  }
}

