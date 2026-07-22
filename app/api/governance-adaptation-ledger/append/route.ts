import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendRequest, requireGovernanceAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceAdaptationLedgerUser();
    return apiSuccess(await appendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append governance adaptation ledger entry.");
  }
}
