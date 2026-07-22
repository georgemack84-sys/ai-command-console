import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, detectRequest, requireConstitutionalViolationDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional violation detection engine."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(await detectRequest(request)); }
  catch (error) { return apiError(error, "Unable to detect constitutional violations."); }
}
