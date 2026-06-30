import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyIntegrityVerificationRequest, requireIntegrityVerificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await classifyIntegrityVerificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify Integrity Verification failure."); }
}
