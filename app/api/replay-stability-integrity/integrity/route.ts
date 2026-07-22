import { integrityRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity validator."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity validator."); } }
