import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await inspectRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect recommendation performance ledger.");
  }
}
