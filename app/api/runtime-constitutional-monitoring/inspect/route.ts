import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireRuntimeConstitutionalMonitoringUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect runtime constitutional monitoring."); }
}
export async function POST(request: Request) {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect runtime constitutional monitoring."); }
}
