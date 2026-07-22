import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireRecommendationSynthesisUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationSynthesisUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to validate recommendation authority."); } }
export async function POST(request: Request) { try { await requireRecommendationSynthesisUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to validate recommendation authority."); } }
