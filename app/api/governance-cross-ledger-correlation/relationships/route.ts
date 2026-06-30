import { apiError, apiSuccess } from "@/src/server/api/response";
import { relationshipsGovernanceCorrelationRequest, requireGovernanceCrossLedgerCorrelationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceCrossLedgerCorrelationUser();
    return apiSuccess(await relationshipsGovernanceCorrelationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance correlations.");
  }
}
