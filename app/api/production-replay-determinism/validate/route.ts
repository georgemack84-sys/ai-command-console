import { requireProductionReplayDeterminismUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Production Replay Determinism."); } }
