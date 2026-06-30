import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityVerificationUser, resultsIntegrityVerificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await resultsIntegrityVerificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Integrity Verification results."); }
}
