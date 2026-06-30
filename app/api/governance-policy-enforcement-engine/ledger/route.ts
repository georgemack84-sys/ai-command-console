import { apiError, apiSuccess } from "@/src/server/api/response";
import { governancePolicyLedgerRequest, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await governancePolicyLedgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance policy ledger entry.");
  }
}
