import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";
import { createSource, requestSourceRefresh } from "@/src/server/services/source-service";

const postSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  updateCadence: z.string().optional(),
  description: z.string().optional(),
  type: z.literal("feed").default("feed"),
  refreshOnCreate: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const snapshot = await getWorkspaceSnapshot(user.workspaceId);
    return apiSuccess({ sources: snapshot.sources });
  } catch (error) {
    return apiError(error, "Unable to load sources.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    const body = postSchema.parse(await request.json());
    const source = await createSource({
      workspaceId: user.workspaceId,
      userId: user.id,
      userRole: user.role,
      name: body.name,
      type: body.type,
      url: body.url,
      updateCadence: body.updateCadence,
      description: body.description,
    });

    let refreshJob = null;
    let refreshError: string | null = null;
    if (body.refreshOnCreate) {
      try {
        refreshJob = await requestSourceRefresh({
          workspaceId: user.workspaceId,
          userId: user.id,
          userRole: user.role,
          sourceId: source.id,
        });
      } catch (error) {
        refreshError = error instanceof Error ? error.message : String(error);
      }
    }

    const snapshot = await getWorkspaceSnapshot(user.workspaceId);
    return apiSuccess({ source, sources: snapshot.sources, refreshJob, refreshError }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create source.");
  }
}
