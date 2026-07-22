import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordRequest, requireStrategyEvolutionLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(await recordRequest(request));
  } catch (error) {
    return apiError(error, "Unable to record strategy evolution ledger entry.");
  }
}
