import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSecurityGovernanceValidationUser, validationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSecurityGovernanceValidationUser(); return apiSuccess(await validationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Security Governance Validation."); }
}
