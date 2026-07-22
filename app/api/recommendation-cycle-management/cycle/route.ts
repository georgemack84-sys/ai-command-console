import { apiError, apiSuccess } from "@/src/server/api/response";
import { cycleRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await cycleRequest()); } catch (error) { return apiError(error, "Unable to retrieve recommendation cycle."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await cycleRequest(request)); } catch (error) { return apiError(error, "Unable to create or retrieve recommendation cycle."); } }
