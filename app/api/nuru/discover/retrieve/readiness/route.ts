import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruDiscoverySourceReadiness } from "@/src/server/services/nuru-discovery-source-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getSessionUser())) throw new AppError(401, "unauthorized", "Sign in to view Nuru source readiness.");
    return apiSuccess(getNuruDiscoverySourceReadiness());
  } catch (error) {
    return apiError(error, "Nuru source readiness is unavailable.");
  }
}
