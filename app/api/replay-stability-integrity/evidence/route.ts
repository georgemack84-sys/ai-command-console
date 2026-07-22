import { evidenceRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity evidence."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity evidence."); } }
