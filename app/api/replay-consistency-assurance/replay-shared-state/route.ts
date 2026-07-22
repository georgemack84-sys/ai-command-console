import { apiError, apiSuccess } from "@/src/server/api/response";
import { replaySharedStateRequest, requireReplayConsistencyUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayConsistencyUser(); return apiSuccess(await replaySharedStateRequest(request)); }
  catch (error) { return apiError(error, "Unable to replay shared state artifacts."); }
}
