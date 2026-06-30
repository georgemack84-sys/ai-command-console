import { apiError, apiSuccess } from "@/src/server/api/response";
import { driftHealthAssessmentRequest, requireDriftHealthIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(await driftHealthAssessmentRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build Drift & Health assessment.");
  }
}
