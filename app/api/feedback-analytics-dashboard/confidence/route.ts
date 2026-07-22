import { apiError, apiSuccess } from "@/src/server/api/response";
import { confidenceRequest, requireFeedbackAnalyticsDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackAnalyticsDashboardUser();
    return apiSuccess(await confidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence trends dashboard.");
  }
}
