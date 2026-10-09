import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";
import { z } from "zod";
import { requireWorkspaceViewer, requireWorkspaceMember } from "@/src/server/auth/permissions";
import { executeGovernedInsightGenerationAction } from "@/src/server/services/governed-insight-generation-action-service";

const postSchema = z.object({
  async: z.boolean().optional(),
  confirmed: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const snapshot = await getWorkspaceSnapshot(user.workspaceId);
    return apiSuccess({ insights: snapshot.insights });
  } catch (error) {
    return apiError(error, "Unable to load insights.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = postSchema.parse(await request.json().catch(() => ({})));
    const result = await executeGovernedInsightGenerationAction(
      {
        action: body.async ? "generate-queued" : "generate-direct",
        payload: body,
        confirmed: body.confirmed,
      },
      user,
    );
    if (result.requiresConfirmation || result.simulated) {
      return apiSuccess(result);
    }
    const actionResult = result as unknown as { data: unknown; status?: number };
    return apiSuccess(actionResult.data, actionResult.status ? { status: actionResult.status } : undefined);
  } catch (error) {
    return apiError(error, "Unable to generate insights.");
  }
}
