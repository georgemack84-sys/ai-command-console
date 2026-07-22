import { apiError, apiSuccess } from "@/src/server/api/response";
import { reconstructionRequest, requireBehavioralReplayDivergenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await reconstructionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF behavioral reconstruction."); } }
export async function POST(request: Request) { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await reconstructionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF behavioral reconstruction."); } }
