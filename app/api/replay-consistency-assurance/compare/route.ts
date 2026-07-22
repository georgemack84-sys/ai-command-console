import { apiError, apiSuccess } from "@/src/server/api/response";
import { compareRequest, requireReplayConsistencyUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayConsistencyUser(); return apiSuccess(await compareRequest(request)); }
  catch (error) { return apiError(error, "Unable to compare replay results."); }
}
