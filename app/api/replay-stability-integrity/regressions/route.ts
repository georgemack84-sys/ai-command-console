import { regressionsRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await regressionsRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity regressions."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await regressionsRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity regressions."); } }
