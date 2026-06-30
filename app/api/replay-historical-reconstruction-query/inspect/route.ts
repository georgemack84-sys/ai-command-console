import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectReplayHistoricalReconstructionRequest, requireReplayHistoricalReconstructionUser, validateReplayHistoricalReconstructionRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayHistoricalReconstructionUser(); return apiSuccess(await inspectReplayHistoricalReconstructionRequest()); }
  catch (error) { return apiError(error, "Unable to inspect Replay & Historical Reconstruction Query."); }
}
export async function POST(request: Request) {
  try { await requireReplayHistoricalReconstructionUser(); return apiSuccess({ validation: await validateReplayHistoricalReconstructionRequest(request), observability: await inspectReplayHistoricalReconstructionRequest(request) }); }
  catch (error) { return apiError(error, "Unable to validate Replay & Historical Reconstruction Query."); }
}
