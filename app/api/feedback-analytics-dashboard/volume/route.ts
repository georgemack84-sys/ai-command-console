import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFeedbackAnalyticsDashboardUser, volumeRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackAnalyticsDashboardUser();
    return apiSuccess(await volumeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback volume dashboard.");
  }
}
