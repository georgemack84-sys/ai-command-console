import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternIntelligenceDashboardUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternIntelligenceDashboardUser();
    return apiSuccess(await sectionRequest(request, "confidence_dashboard"));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern confidence dashboard.");
  }
}
