import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireOrchestrationCertificationGateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireOrchestrationCertificationGateUser();
    return apiSuccess(reportForRequest(request).production_readiness_assessment);
  } catch (error) {
    return apiError(error, "Unable to load Orchestration Certification Gate readiness assessment.");
  }
}
