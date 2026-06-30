import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityVerificationUser, validateIntegrityVerificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await validateIntegrityVerificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Integrity Verification report."); }
}
