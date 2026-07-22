import { engineRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read risk engine."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read risk engine."); } }
