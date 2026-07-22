import { apiError, apiSuccess } from "@/src/server/api/response";
import { eligibilityRequest, requireRecommendationSynthesisUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationSynthesisUser(); return apiSuccess(await eligibilityRequest()); } catch (error) { return apiError(error, "Unable to validate recommendation eligibility."); } }
export async function POST(request: Request) { try { await requireRecommendationSynthesisUser(); return apiSuccess(await eligibilityRequest(request)); } catch (error) { return apiError(error, "Unable to validate recommendation eligibility."); } }
