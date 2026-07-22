import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceAuthorityPolicyUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceAuthorityPolicyUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF governance authority policy contract."); } }
