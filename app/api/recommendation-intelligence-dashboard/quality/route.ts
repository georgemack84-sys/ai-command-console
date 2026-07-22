import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationDashboardUser();
    return apiSuccess(await sectionRequest(request, "quality_dashboard"));
  } catch (error) {
    return apiError(error, "Unable to retrieve recommendation quality dashboard.");
  }
}
