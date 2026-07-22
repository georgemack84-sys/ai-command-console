import { apiError, apiSuccess } from "@/src/server/api/response";
import { monitorRequest, requireCoordinationConflictUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await monitorRequest(request)); }
  catch (error) { return apiError(error, "Unable to monitor coordination conflicts."); }
}
