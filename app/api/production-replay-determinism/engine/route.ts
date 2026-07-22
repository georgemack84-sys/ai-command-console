import { engineRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism engine."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism engine."); } }
