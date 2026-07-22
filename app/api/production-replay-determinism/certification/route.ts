import { certificationRequest, requireProductionReplayDeterminismUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism certification."); } }
export async function POST(request: Request) { try { await requireProductionReplayDeterminismUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Replay Determinism certification."); } }
