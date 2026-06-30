import { apiError, apiSuccess } from "@/src/server/api/response";
import { getQueryCertificationGateContractResponse, requireQueryCertificationGateUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireQueryCertificationGateUser(); return apiSuccess(getQueryCertificationGateContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Query Certification Gate contract."); }
}
