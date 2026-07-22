import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayConsistencyUser, startRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayConsistencyUser(); return apiSuccess(await startRequest(request)); }
  catch (error) { return apiError(error, "Unable to start replay consistency session."); }
}
