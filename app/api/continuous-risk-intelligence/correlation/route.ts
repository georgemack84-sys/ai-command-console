import { correlationRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await correlationRequest()); } catch (error) { return apiError(error, "Unable to read risk correlation."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await correlationRequest(request)); } catch (error) { return apiError(error, "Unable to read risk correlation."); } }
