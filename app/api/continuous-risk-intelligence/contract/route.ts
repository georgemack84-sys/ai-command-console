import { contractResponse, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to read Continuous Risk Intelligence contract."); } }
