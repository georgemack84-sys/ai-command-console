import { apiError, apiSuccess } from "@/src/server/api/response";
import { commitRequest, requireAdaptationProposalLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationProposalLedgerUser();
    return apiSuccess(await commitRequest(request));
  } catch (error) {
    return apiError(error, "Unable to commit adaptation proposal ledger.");
  }
}
