import { apiError, apiSuccess } from "@/src/server/api/response";
import { commitRequest, requireRiskAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationLedgerUser();
    return apiSuccess(await commitRequest(request));
  } catch (error) {
    return apiError(error, "Unable to commit risk adaptation ledger entry.");
  }
}
