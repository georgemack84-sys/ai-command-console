import { apiError, apiSuccess } from "@/src/server/api/response";
import { divergenceRequest, requireBehavioralReplayDivergenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await divergenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF divergence analysis."); } }
export async function POST(request: Request) { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await divergenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF divergence analysis."); } }
