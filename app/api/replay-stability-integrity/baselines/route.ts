import { baselinesRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await baselinesRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity baselines."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await baselinesRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity baselines."); } }
