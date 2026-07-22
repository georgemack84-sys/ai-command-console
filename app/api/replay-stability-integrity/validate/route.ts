import { requireReplayStabilityIntegrityUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Replay Stability Integrity."); } }
