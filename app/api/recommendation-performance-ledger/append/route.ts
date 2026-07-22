import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await appendRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append recommendation performance record.");
  }
}
