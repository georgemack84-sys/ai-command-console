import { apiError, apiSuccess } from "@/src/server/api/response";
import { contextRequest, requireBehavioralReplayDivergenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await contextRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF replay context."); } }
export async function POST(request: Request) { try { await requireBehavioralReplayDivergenceUser(); return apiSuccess(await contextRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF replay context."); } }
