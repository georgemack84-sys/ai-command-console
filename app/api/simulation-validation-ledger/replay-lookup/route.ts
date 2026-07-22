import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayLookupRequest, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(await replayLookupRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve simulation replay ledger entry.");
  }
}
