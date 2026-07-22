import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRecommendationCycleUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRecommendationCycleUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect recommendation cycle contract."); } }
