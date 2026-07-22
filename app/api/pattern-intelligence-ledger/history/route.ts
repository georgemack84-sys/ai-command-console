import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternLedgerUser, retrievePatternLedgerHistoryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(await retrievePatternLedgerHistoryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern ledger history.");
  }
}
