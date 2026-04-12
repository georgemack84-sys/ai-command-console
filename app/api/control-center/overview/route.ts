import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { ensureDigestScheduler } from "@/services/digestScheduler";
import { buildControlCenterOverview } from "@/src/server/services/control-center-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureDigestScheduler();
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }

    return apiSuccess({
      overview: await buildControlCenterOverview(user),
    });
  } catch (error) {
    return apiError(error, "Unable to load control center overview.");
  }
}
