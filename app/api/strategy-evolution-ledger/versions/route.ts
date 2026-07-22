import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyEvolutionLedgerUser, versionsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(await versionsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategy evolution ledger versions.");
  }
}
