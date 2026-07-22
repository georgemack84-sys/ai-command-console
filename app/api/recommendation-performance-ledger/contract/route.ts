import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRecommendationPerformanceLedgerContractResponse, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(getRecommendationPerformanceLedgerContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recommendation performance ledger contract.");
  }
}
