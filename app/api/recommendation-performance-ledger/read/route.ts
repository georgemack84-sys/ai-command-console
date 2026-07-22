import { apiError, apiSuccess } from "@/src/server/api/response";
import { readRecommendationPerformanceLedgerRequest, requireRecommendationPerformanceLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecommendationPerformanceLedgerUser();
    return apiSuccess(await readRecommendationPerformanceLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to read recommendation performance ledger.");
  }
}
