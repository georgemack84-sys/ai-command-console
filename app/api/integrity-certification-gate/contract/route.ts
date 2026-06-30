import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityCertificationContractResponse, requireIntegrityCertificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityCertificationUser(); return apiSuccess(getIntegrityCertificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Integrity Certification contract."); }
}
