import { contractResponse, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism contract."); } }
