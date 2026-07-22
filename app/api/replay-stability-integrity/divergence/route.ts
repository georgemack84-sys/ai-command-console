import { divergenceRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await divergenceRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity divergence analysis."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await divergenceRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity divergence analysis."); } }
