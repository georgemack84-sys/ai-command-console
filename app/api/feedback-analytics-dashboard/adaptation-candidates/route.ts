import { adaptationCandidatesRequest, requireFeedbackAnalyticsDashboardUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackAnalyticsDashboardUser();
    return apiSuccess(await adaptationCandidatesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation candidates dashboard.");
  }
}
