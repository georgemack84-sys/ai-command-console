import { lineageRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism lineage."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism lineage."); } }
