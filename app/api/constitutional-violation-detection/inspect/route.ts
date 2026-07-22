import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConstitutionalViolationDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect constitutional violation detection."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect constitutional violation detection."); }
}
