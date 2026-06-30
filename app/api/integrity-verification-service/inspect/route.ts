import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectIntegrityVerificationRequest, requireIntegrityVerificationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await inspectIntegrityVerificationRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Integrity Verification."); }
}
export async function POST(request: Request) {
  try { await requireIntegrityVerificationUser(); return apiSuccess(await inspectIntegrityVerificationRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect Integrity Verification."); }
}
