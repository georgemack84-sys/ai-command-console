import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay recommendation cycle."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay recommendation cycle."); } }
