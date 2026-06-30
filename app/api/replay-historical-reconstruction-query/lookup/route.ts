import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayHistoricalReconstructionUser, runReplayHistoricalReconstructionRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireReplayHistoricalReconstructionUser(); return apiSuccess(await runReplayHistoricalReconstructionRequest(request)); }
  catch (error) { return apiError(error, "Unable to run Replay & Historical Reconstruction Query."); }
}
