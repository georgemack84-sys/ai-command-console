import { apiError, apiSuccess } from "@/src/server/api/response";
import { archiveRequest, requireRecommendationSynthesisUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireRecommendationSynthesisUser(); return apiSuccess(await archiveRequest(request)); } catch (error) { return apiError(error, "Unable to archive recommendation."); } }
