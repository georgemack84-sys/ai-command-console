import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await integrityRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate recommendation performance ledger integrity.");
  }
}
