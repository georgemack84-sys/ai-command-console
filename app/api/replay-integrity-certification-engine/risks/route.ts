import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayIntegrityCertificationUser, risksRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayIntegrityCertificationUser(); return apiSuccess(await risksRequest(request)); }
  catch (error) { return apiError(error, "Unable to load Replay Integrity risks."); }
}
