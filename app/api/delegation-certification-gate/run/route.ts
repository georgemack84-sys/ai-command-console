import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportDelegationCertificationRequest, requireDelegationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationCertificationUser();
    const report = await reportDelegationCertificationRequest(request);
    return apiSuccess({
      certification_id: report.certification_id,
      certification_result: report.certification_result,
      execution_orchestration_allowed: report.execution_orchestration_allowed,
      phase8e_progression_allowed: report.phase8e_progression_allowed,
      report_hash: report.report_hash,
    });
  } catch (error) {
    return apiError(error, "Unable to run Delegation Certification Gate.");
  }
}
