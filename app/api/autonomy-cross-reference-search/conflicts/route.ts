import { apiError, apiSuccess } from "@/src/server/api/response";
import { conflictsRequest, requireAutonomyCrossReferenceSearchUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomyCrossReferenceSearchUser(); return apiSuccess(await conflictsRequest(request)); }
  catch (error) { return apiError(error, "Unable to load cross-reference conflicts."); }
}
