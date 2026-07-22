import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluationRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await evaluationRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle evaluation."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await evaluationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle evaluation."); } }
