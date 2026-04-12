import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildDashboardSnapshot } from "@/src/server/services/dashboard-service";
import { AppError } from "@/src/server/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    const snapshot = await buildDashboardSnapshot(user.workspaceId);
    return apiSuccess(snapshot);
  } catch (error) {
    return apiError(error, "Unable to load dashboard data.");
  }
}
