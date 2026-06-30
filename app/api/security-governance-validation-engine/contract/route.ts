import { apiError, apiSuccess } from "@/src/server/api/response";
import { getSecurityGovernanceValidationContractResponse, requireSecurityGovernanceValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSecurityGovernanceValidationUser(); return apiSuccess(getSecurityGovernanceValidationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Security Governance Validation contract."); }
}
