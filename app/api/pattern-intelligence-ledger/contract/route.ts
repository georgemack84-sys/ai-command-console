import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternLedgerContractResponse, requirePatternLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternLedgerUser();
    return apiSuccess(getPatternLedgerContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern intelligence ledger contract.");
  }
}
