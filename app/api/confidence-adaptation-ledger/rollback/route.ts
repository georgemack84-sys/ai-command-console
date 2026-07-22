import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceAdaptationLedgerUser, rollbackRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceAdaptationLedgerUser();
    return apiSuccess(await rollbackRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence rollback history.");
  }
}
