import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireOrchestrationCertificationGateUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireOrchestrationCertificationGateUser();
    const report = reportForRequest(request);
    return apiSuccess({
      certification_id: report.certification_id,
      certification_result: report.certification_result,
      production_readiness_assessment: report.production_readiness_assessment,
      report_hash: report.report_hash,
    });
  } catch (error) {
    return apiError(error, "Unable to run Orchestration Certification Gate.");
  }
}
