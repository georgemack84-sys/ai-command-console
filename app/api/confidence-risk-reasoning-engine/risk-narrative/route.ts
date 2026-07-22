import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceRiskUser, riskNarrativeRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(await riskNarrativeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate risk narrative.");
  }
}
