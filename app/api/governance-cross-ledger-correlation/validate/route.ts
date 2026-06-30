import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceCrossLedgerCorrelationUser, validateGovernanceCorrelationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await validateGovernanceCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance cross-ledger correlation.");
  }
}
