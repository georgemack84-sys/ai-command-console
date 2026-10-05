import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruPersonalDiscoveryDetail } from "@/src/server/services/nuru-personal-discovery-detail-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to view this Nuru discovery.");
    const { id } = await context.params;
    const detail = await getNuruPersonalDiscoveryDetail(user.id, id);
    if (!detail) throw new AppError(404, "not_found", "This discovery is not available from your edition or a grounded Rabbit Hole path.");
    return apiSuccess(detail);
  } catch (error) {
    return apiError(error, "Nuru could not load this discovery.");
  }
}
