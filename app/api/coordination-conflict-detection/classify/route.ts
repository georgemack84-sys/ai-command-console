import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyRequest, requireCoordinationConflictUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await classifyRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify coordination conflicts."); }
}
