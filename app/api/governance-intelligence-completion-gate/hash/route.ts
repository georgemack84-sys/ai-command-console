import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceCompletionGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceCompletionGateUser(); const report = reportForRequest(request); return apiSuccess({ report_hash: report.report_hash, integrity_hash: report.completion_run.integrity_hash, evidence_hash: report.evidence_package.evidence_hash, ledger_hash: report.truth_ledger_record.ledger_hash }); } catch (error) { return apiError(error, "Unable to retrieve Governance Intelligence completion hashes."); } }
