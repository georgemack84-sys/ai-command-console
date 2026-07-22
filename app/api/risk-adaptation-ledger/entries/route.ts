import { apiError, apiSuccess } from "@/src/server/api/response";
import { entriesRequest, requireRiskAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationLedgerUser();
    return apiSuccess(await entriesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation ledger entries.");
  }
}
