import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await lineageRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve recommendation performance lineage.");
  }
}
