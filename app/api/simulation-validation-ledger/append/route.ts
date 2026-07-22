import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendRequest, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(await appendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append simulation validation ledger record.");
  }
}
