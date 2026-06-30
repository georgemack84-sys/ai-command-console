import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceDeterministicReplayValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceDeterministicReplayValidationUser(); const report = reportForRequest(request); return apiSuccess({ replay_validation_id: report.replay_validation_run.replay_validation_id, ledger_hash: report.truth_ledger_record.ledger_hash, report_hash: report.report_hash }); } catch (error) { return apiError(error, "Unable to hash deterministic replay validation report."); } }
