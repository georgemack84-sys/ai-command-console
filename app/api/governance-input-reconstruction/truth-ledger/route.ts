import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceInputReconstructionUser, truthLedgerInputsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInputReconstructionUser();
    return apiSuccess(await truthLedgerInputsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to resolve governance input Truth Ledger references.");
  }
}
