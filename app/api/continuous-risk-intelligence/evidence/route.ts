import { evidenceRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read risk evidence."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read risk evidence."); } }
