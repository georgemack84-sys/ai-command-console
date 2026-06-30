import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLedgerExplorerRecordsForRequest, requireLedgerExplorerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireLedgerExplorerUser();
    return apiSuccess(getLedgerExplorerRecordsForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load Ledger Explorer records.");
  }
}
