import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireSimulationValidationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSimulationValidationLedgerUser();
    return apiSuccess(await lineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to traverse simulation validation lineage.");
  }
}
