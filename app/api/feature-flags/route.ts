import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { ensureDefaultFeatureFlags, listFeatureFlags, setWorkspaceFeatureFlag, updateFeatureFlag } from "@/src/server/feature-flags/feature-flag-service";

const patchSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("global"),
    key: z.string().min(1),
    enabled: z.boolean(),
  }),
  z.object({
    scope: z.literal("workspace"),
    key: z.string().min(1),
    enabled: z.boolean(),
    workspaceId: z.string().min(1),
  }),
]);

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      throw new AppError(403, "forbidden", "Admin access required.");
    }

    await ensureDefaultFeatureFlags();
    return apiSuccess({ flags: await listFeatureFlags() });
  } catch (error) {
    return apiError(error, "Unable to load feature flags.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      throw new AppError(403, "forbidden", "Admin access required.");
    }

    const body = patchSchema.parse(await request.json());
    if (body.scope === "global") {
      const flag = await updateFeatureFlag(body.key, body.enabled);
      return apiSuccess({ flag });
    }

    const flag = await setWorkspaceFeatureFlag({
      workspaceId: body.workspaceId,
      key: body.key,
      enabled: body.enabled,
    });
    return apiSuccess({ flag });
  } catch (error) {
    return apiError(error, "Unable to update feature flags.");
  }
}
