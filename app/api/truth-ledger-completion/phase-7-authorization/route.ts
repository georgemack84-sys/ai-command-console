import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTruthLedgerCompletionForRequest, requireTruthLedgerCompletionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireTruthLedgerCompletionUser();
    return apiSuccess(getTruthLedgerCompletionForRequest(request).phase_7_authorization);
  } catch (error) {
    return apiError(error, "Unable to load Phase 7 authorization package.");
  }
}
