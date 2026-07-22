import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternScoringContractResponse, requirePatternScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternScoringUser();
    return apiSuccess(getPatternScoringContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load pattern scoring contract.");
  }
}
