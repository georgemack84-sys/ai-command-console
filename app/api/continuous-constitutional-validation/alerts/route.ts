import { alertsRequest, requireContinuousConstitutionalUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await alertsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional violation alerts."); }
}
