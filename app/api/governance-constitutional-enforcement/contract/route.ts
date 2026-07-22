import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireGovernanceEnforcementUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireGovernanceEnforcementUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect governance constitutional enforcement contract."); } }
