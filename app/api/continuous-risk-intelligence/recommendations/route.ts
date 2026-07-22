import { recommendationsRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to read risk recommendations."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to read risk recommendations."); } }
