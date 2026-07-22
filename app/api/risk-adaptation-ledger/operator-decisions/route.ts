import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorDecisionsRequest, requireRiskAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationLedgerUser();
    return apiSuccess(await operatorDecisionsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve risk adaptation operator decisions.");
  }
}
