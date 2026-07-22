import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireStrategyEvolutionLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect strategy evolution ledger.");
  }
}

export async function POST(request: Request) {
  try {
    await requireStrategyEvolutionLedgerUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect strategy evolution ledger.");
  }
}
