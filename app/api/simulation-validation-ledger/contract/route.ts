import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation validation ledger contract.");
  }
}
