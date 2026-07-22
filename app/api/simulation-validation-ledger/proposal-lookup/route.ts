import { apiError, apiSuccess } from "@/src/server/api/response";
import { proposalLookupRequest, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(await proposalLookupRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation proposal ledger entry.");
  }
}
