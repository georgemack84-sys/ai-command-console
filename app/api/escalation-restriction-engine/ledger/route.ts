import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireEscalationRestrictionEngineUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEscalationRestrictionEngineUser();
    return apiSuccess(await ledgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve escalation restriction ledger entry.");
  }
}
