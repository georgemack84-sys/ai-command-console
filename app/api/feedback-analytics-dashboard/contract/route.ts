import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireFeedbackAnalyticsDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireFeedbackAnalyticsDashboardUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback analytics dashboard contract.");
  }
}
