import { apiError, apiSuccess } from "@/src/server/api/response";
import { completionRequest, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(await completionRequest()); } catch (error) { return apiError(error, "Unable to validate recommendation cycle completion."); } }
export async function POST(request: Request) { try { await requireRecommendationCycleUser(); return apiSuccess(await completionRequest(request)); } catch (error) { return apiError(error, "Unable to validate recommendation cycle completion."); } }
