import { apiError, apiSuccess } from "@/src/server/api/response";
import { correlateGovernanceLedgersRequest, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await correlateGovernanceLedgersRequest(request));
  } catch (error) {
    return apiError(error, "Unable to correlate governance ledgers.");
  }
}
