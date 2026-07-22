import { analyzersRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await analyzersRequest()); } catch (error) { return apiError(error, "Unable to read risk analyzers."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await analyzersRequest(request)); } catch (error) { return apiError(error, "Unable to read risk analyzers."); } }
