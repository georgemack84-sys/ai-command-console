import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportForRequest, requireGovernanceCompletionGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceCompletionGateUser(); return apiSuccess(reportForRequest(request).evidence_package); } catch (error) { return apiError(error, "Unable to retrieve Governance Intelligence completion evidence."); } }
