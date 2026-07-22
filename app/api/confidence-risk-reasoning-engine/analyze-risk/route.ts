import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRiskRequest, requireConfidenceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(await analyzeRiskRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze risk reasoning.");
  }
}
