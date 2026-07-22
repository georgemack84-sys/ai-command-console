import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, monitorRequest, requireRuntimeConstitutionalMonitoringUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load runtime constitutional monitoring engine."); }
}
export async function POST(request: Request) {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(await monitorRequest(request)); }
  catch (error) { return apiError(error, "Unable to monitor runtime constitutional compliance."); }
}
