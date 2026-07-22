import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptationProposalLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptationProposalLedgerUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation proposal ledger contract.");
  }
}
