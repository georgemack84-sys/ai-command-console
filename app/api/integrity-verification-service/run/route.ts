import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireIntegrityVerificationUser, runIntegrityVerificationRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await runIntegrityVerificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Integrity Verification."); }
}
