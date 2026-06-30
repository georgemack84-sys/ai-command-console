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
      report_hash: report.report_hash,
      evidence_hash: report.certification_evidence.certification_hash,
      ledger_hash: report.certification_ledger_entry.ledger_hash,
      result_hash: report.certification_result.result_hash,
    });
  } catch (error) {
    return apiError(error, "Unable to load Orchestration Certification Gate hashes.");
  }
}
