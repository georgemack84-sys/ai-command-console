import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategyEvolutionLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution ledger contract.");
  }
}
