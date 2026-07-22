import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireStrategyEvolutionLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(await integrityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to verify strategy evolution ledger integrity.");
  }
}
