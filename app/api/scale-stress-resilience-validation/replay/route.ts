import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireScaleStressResilienceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScaleStressResilienceUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load scale replay."); } }
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load scale replay."); } }
