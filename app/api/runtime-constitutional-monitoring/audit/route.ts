import { auditRequest, requireRuntimeConstitutionalMonitoringUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireRuntimeConstitutionalMonitoringUser(); return apiSuccess(await auditRequest(request)); }
  catch (error) { return apiError(error, "Unable to list runtime constitutional audits."); }
}
