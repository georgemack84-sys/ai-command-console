import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSettingsSnapshot, updateWorkspaceSettings } from "@/src/server/services/workspace-service";

const patchSchema = z.object({
  workspaceName: z.string().min(1).optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    return apiSuccess(await getWorkspaceSettingsSnapshot(user.id, user.workspaceId));
  } catch (error) {
    return apiError(error, "Unable to load settings.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = patchSchema.parse(await request.json());
    const snapshot = await updateWorkspaceSettings({
      userId: user.id,
      userRole: user.role,
      workspaceId: user.workspaceId,
      workspaceName: body.workspaceName,
    });

    return apiSuccess(snapshot);
  } catch (error) {
    return apiError(error, "Unable to update settings.");
  }
}
