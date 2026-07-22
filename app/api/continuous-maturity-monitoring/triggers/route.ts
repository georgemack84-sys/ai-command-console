import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireContinuousMonitoringUser, triggersRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousMonitoringUser(); return apiSuccess(await triggersRequest(request)); }
  catch (error) { return apiError(error, "Unable to list maturity monitoring triggers."); }
}
