import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceDeterministicReplayValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceDeterministicReplayValidationUser(); return apiSuccess(reportForRequest(request)); } catch (error) { return apiError(error, "Unable to run deterministic replay validation."); } }
