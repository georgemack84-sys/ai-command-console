import { apiError, apiSuccess } from "@/src/server/api/response";
import { getLedgerExplorerViewForRequest, requireLedgerExplorerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireLedgerExplorerUser();
    return apiSuccess(getLedgerExplorerViewForRequest(request).selected_record.historical_reconstruction);
  } catch (error) {
    return apiError(error, "Unable to load historical reconstruction.");
  }
}
