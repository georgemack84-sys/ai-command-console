import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceDeterministicReplayValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceDeterministicReplayValidationUser(); return apiSuccess(reportForRequest(request).truth_ledger_record); } catch (error) { return apiError(error, "Unable to retrieve replay validation ledger record."); } }
