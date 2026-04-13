import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { createWorkspaceSettingsInvite, revokeWorkspaceSettingsInvite, getWorkspaceSettingsSnapshot } from "@/src/server/services/workspace-service";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";

const postSchema = z.object({
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
});

const deleteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const body = postSchema.parse(await request.json());
    const invite = await createWorkspaceSettingsInvite({
      userId: user.id,
      userRole: user.role,
      workspaceId: user.workspaceId,
      email: body.email ?? undefined,
    });

    return apiSuccess({ invite }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create invite.");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const body = token ? { token } : deleteSchema.parse(await request.json());

    const invite = await revokeWorkspaceSettingsInvite({
      userId: user.id,
      userRole: user.role,
      workspaceId: user.workspaceId,
      token: body.token,
    });

    return apiSuccess({ invite, snapshot: await getWorkspaceSettingsSnapshot(user.id, user.workspaceId) });
  } catch (error) {
    return apiError(error, "Unable to revoke invite.");
  }
}
