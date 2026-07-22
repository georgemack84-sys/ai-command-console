import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCoordinationConflictUser, resolutionRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationConflictUser(); return apiSuccess(await resolutionRequest(request)); }
  catch (error) { return apiError(error, "Unable to generate coordination conflict resolution recommendation."); }
}
