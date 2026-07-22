import { comparatorRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await comparatorRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism comparator."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await comparatorRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism comparator."); } }
