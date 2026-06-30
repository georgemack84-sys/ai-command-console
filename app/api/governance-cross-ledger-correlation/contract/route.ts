import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceCrossLedgerCorrelationContractResponse, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(getGovernanceCrossLedgerCorrelationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance cross-ledger correlation contract.");
  }
}
