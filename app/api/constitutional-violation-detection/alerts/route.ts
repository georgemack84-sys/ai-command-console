import { apiError, apiSuccess } from "@/src/server/api/response";
import { alertsRequest, requireConstitutionalViolationDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(await alertsRequest(request)); }
  catch (error) { return apiError(error, "Unable to issue constitutional violation alerts."); }
}
