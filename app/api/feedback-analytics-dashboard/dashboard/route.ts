import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireFeedbackAnalyticsDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackAnalyticsDashboardUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to render feedback analytics dashboard.");
  }
}
