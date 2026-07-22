import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConfidenceAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceAdaptationLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence adaptation ledger contract.");
  }
}
