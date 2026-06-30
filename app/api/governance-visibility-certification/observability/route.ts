import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityForRequest, requireGovernanceVisibilityCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceVisibilityCertificationUser(); return apiSuccess(observabilityForRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve governance visibility certification observability."); } }
