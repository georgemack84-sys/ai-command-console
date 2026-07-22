import { requireProductionReplayDeterminismUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Production Replay Determinism."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Production Replay Determinism."); } }
