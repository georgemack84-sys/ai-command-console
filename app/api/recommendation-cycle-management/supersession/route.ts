import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRecommendationCycleUser, supersessionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await supersessionRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle supersession."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await supersessionRequest(request)); } catch (error) { return apiError(error, "Unable to supersede recommendation cycle."); } }
