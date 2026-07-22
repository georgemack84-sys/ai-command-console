import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternReplayContractResponse, requirePatternReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternReplayUser();
    return apiSuccess(getPatternReplayContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern replay explainability contract.");
  }
}
