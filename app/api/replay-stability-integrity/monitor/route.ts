import { monitorRequest, requireReplayStabilityIntegrityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await monitorRequest()); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity monitor."); } }
export async function POST(request: Request) { try { await requireReplayStabilityIntegrityUser(); return apiSuccess(await monitorRequest(request)); } catch (error) { return apiError(error, "Unable to read Replay Stability Integrity monitor."); } }
