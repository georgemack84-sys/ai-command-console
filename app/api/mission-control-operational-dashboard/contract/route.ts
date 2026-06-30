import { apiError, apiSuccess } from "@/src/server/api/response";
import { getMissionControlOperationalDashboardContractResponse, requireMissionControlOperationalDashboardUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireMissionControlOperationalDashboardUser(); return apiSuccess(getMissionControlOperationalDashboardContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Mission Control Operational Dashboard contract."); }
}
