import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceCertificationOrchestratorUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceCertificationOrchestratorUser(); const report = reportForRequest(request); return apiSuccess({ certification_run_id: report.run.certification_run_id, ledger_hash: report.truth_ledger_record.ledger_hash, report_hash: report.report_hash }); } catch (error) { return apiError(error, "Unable to hash governance certification orchestrator report."); } }
