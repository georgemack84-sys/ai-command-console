import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await registryRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve recommendation performance registry.");
  }
}
