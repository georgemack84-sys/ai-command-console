import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRequest, requireRecommendationSynthesisUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationSynthesisUser(); return apiSuccess(await createRequest()); } catch (error) { return apiError(error, "Unable to create recommendation synthesis."); } }
export async function POST(request: Request) { try { await requireRecommendationSynthesisUser(); return apiSuccess(await createRequest(request)); } catch (error) { return apiError(error, "Unable to create recommendation synthesis."); } }
