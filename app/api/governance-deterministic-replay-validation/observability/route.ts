import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityForRequest, requireGovernanceDeterministicReplayValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceDeterministicReplayValidationUser(); return apiSuccess(observabilityForRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve replay validation observability."); } }
