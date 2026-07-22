import { contractResponse, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity contract."); } }
