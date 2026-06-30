import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayHistoricalReconstructionContractResponse, requireReplayHistoricalReconstructionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireReplayHistoricalReconstructionUser(); return apiSuccess(getReplayHistoricalReconstructionContractResponse()); }
  catch (error) { return apiError(error, "Unable to load Replay & Historical Reconstruction Query contract."); }
}
