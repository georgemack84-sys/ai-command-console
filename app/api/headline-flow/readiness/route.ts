import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getHeadlineFlowReadiness } from "@/src/server/headline-flow/application/readiness";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    return apiSuccess({
      workspaceId: user.workspaceId,
      readiness: getHeadlineFlowReadiness(),
    });
  } catch (error) {
    return apiError(error, "Unable to load Headline Flow readiness.");
  }
}
