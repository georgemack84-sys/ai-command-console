import { certificationRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity certification."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity certification."); } }
