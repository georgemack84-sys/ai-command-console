import { apiError, apiSuccess } from "@/src/server/api/response";
import { getVisibilityCertificationGateContractResponse, requireVisibilityCertificationGateUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireVisibilityCertificationGateUser(); return apiSuccess(getVisibilityCertificationGateContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Visibility Certification Gate contract."); }
}
