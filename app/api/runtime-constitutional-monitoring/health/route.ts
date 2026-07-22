import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireRuntimeConstitutionalMonitoringUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(await healthRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitution health."); }
}
