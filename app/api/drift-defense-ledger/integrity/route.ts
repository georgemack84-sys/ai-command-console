import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireDriftLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftLedgerUser();
    return apiSuccess(await integrityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve ledger integrity.");
  }
}
