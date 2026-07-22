import { divergenceRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await divergenceRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism divergence."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await divergenceRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism divergence."); } }
