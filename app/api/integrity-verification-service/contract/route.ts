import { apiError, apiSuccess } from "@/src/server/api/response";
import { getIntegrityVerificationContractResponse, requireIntegrityVerificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityVerificationUser(); return apiSuccess(getIntegrityVerificationContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Integrity Verification contract."); }
}
