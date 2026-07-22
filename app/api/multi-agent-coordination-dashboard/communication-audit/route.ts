import { apiError, apiSuccess } from "@/src/server/api/response";
import { communicationAuditRequest, requireCoordinationDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationDashboardUser(); return apiSuccess(await communicationAuditRequest(request)); }
  catch (error) { return apiError(error, "Unable to load dashboard communication audit."); }
}
