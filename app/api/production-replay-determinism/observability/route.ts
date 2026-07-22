import { observabilityRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism observability."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism observability."); } }
