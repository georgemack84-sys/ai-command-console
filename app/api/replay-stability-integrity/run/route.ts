import { requireReplayStabilityIntegrityUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Replay Stability Integrity."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Replay Stability Integrity."); } }
