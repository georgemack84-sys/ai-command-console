import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternLedgerUser, retrievePatternLedgerLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(await retrievePatternLedgerLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern ledger lineage.");
  }
}
