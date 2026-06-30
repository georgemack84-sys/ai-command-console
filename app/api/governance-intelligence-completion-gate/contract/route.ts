import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceCompletionGateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceCompletionGateUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve Governance Intelligence completion gate contract."); } }
