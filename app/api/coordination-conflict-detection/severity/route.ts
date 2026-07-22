import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCoordinationConflictUser, severityRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await severityRequest(request)); }
  catch (error) { return apiError(error, "Unable to assess coordination conflict severity."); }
}
