import { apiError, apiSuccess } from "@/src/server/api/response";
import { generationRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await generationRequest()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle generation."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await generationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle generation."); } }
