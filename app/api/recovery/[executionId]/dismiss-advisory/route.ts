import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { dismissRecoveryOperatorAdvisory } from "@/controllers/recoveryOperatorController";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ executionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { executionId } = await context.params;
    const body = await request.json();
    const result = await dismissRecoveryOperatorAdvisory({
      executionId,
      reason: String(body?.reason || "resolved"),
      dismissedBy: String(body?.dismissedBy || user.email || user.id || "operator"),
    });
    if (!result.ok) {
      throw new AppError(409, result.error, result.reason || "Advisory dismissal is blocked.");
    }
    return apiSuccess(result.data);
  } catch (error) {
    return apiError(error, "Unable to dismiss advisory.");
  }
}

