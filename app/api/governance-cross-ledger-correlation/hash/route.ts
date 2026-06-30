import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceCorrelationRequest, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await hashGovernanceCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance cross-ledger correlation.");
  }
}
