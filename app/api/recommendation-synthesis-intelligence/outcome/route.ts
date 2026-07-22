import { apiError, apiSuccess } from "@/src/server/api/response";
import { outcomeRequest, requireRecommendationSynthesisUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationSynthesisUser(); return apiSuccess(await outcomeRequest()); } catch (error) { return apiError(error, "Unable to resolve recommendation outcome."); } }
export async function POST(request: Request) { try { await requireRecommendationSynthesisUser(); return apiSuccess(await outcomeRequest(request)); } catch (error) { return apiError(error, "Unable to resolve recommendation outcome."); } }
