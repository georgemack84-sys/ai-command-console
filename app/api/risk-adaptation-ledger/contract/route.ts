import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRiskAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRiskAdaptationLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation ledger contract.");
  }
}
