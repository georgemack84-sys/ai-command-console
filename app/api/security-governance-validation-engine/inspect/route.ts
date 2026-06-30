import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireSecurityGovernanceValidationUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireSecurityGovernanceValidationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Security Governance Validation."); }
}
export async function POST(request: Request) {
  try { await requireSecurityGovernanceValidationUser(); return apiSuccess({ validation: await validateRequest(request), observability: await inspectRequest(request) }); }
  catch (error) { return apiError(error, "Unable to inspect Security Governance Validation."); }
}
