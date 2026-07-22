import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDriftLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve drift ledger contract.");
  }
}
